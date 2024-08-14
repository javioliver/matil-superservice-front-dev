/* 
    TABLE FOR SHOW TICKETS DATA
*/

//REACT
import { useState, useMemo, useRef, useEffect, Fragment } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../AuthContext"
import { useSession } from "../../../SessionContext"
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Box, Text, Checkbox, Button, Icon, Tooltip } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//COMPONENTS
import LoadingIconButton from "../../Components/LoadingIconButton" 
import StateMap from "../../Components/StateMap"
import showToast from "../../Components/ToastNotification"
import ConfirmBox from "../../Components/ConfirmBox"
//FUNCTIONS
import timeAgo from "../../Functions/timeAgo"
import timeStampToDate from "../../Functions/timeStampToString"
//ICONS
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'
import { BiEditAlt } from "react-icons/bi"
import { BsTrash3Fill } from "react-icons/bs"

import { MdDeselect } from "react-icons/md"
import { FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa'
import { FaArrowRotateLeft } from "react-icons/fa6"
//TYPING
import { columnsTicketsMap, TicketColumn,  TicketsTableProps, logosMap, Channels, ViewType } from "../../Constants/typing" 
 
//TYPING
interface TableProps{
    data: TicketsTableProps[] | undefined
    updateData:any
    filters:{page_index:number, sort_by?:TicketColumn | 'not_selected', search?:string, order?:'asc' | 'desc'}
    section: 'tickets' | 'clients'
    maxWidth:string
    currentIndex?:number
    selectedView?:ViewType
    allIds?:number[]
}
type Status = 'new' | 'open' | 'solved' | 'pending' | 'closed'
const validStatuses: Status[] = ['new', 'open', 'solved', 'pending', 'closed']

//ALERT LEVEL COMPONENT
const AlertLevel = ({t,  rating }:{t:any, rating:number}) => {
    const getAlertDetails = (rating:number) => {
        switch (rating) {
            case 0:
                return { color: 'green.500', icon: FaCheckCircle, label: `${t('Priority_0')} (0)` }
            case 1:
                return { color: 'yellow.500', icon: FaInfoCircle, label: `${t('Priority_1')} (1)` }
            case 2:
                return { color: 'orange.500', icon: FaExclamationTriangle, label: `${t('Priority_2')} (2)` }
            case 3:
                return { color: 'red.500', icon: FaExclamationCircle, label: `${t('Priority_3')} (3)` }
            case 4:
                return { color: 'red.700', icon: FaExclamationCircle, label: `${t('Priority_4')} (4)` }
            default:
                return { color: 'green.500', icon: FaCheckCircle, label: `${t('Priority_0')} (0)` }
        }
    }
    const { color, icon, label } = getAlertDetails(rating)
    return (
        <Flex gap='10px' alignItems="center">
            <Icon as={icon} color={color}/>
            <Text color={color} fontWeight={'medium'}>
                {label}
            </Text>
        </Flex>
    )
}

//GET THE CELL STYLE
const CellStyle = ({t, column, element, auth}:{t:any, column:TicketColumn, element:string | number | boolean, auth:any}) => {
    if (column === 'local_id') return  <Text color='gray' whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>#{element}</Text>
    else if (column === 'user_id') return  <Text fontWeight={'medium'} whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{element === -1 ?'Matilda':element === 0 ? t('NoAgent'):auth.authData.users[element as string | number].name}</Text>
    else if (column === 'unseen_changes') 
        return(
        <Flex color={element?'red':'green'} alignItems={'center'} gap='5px'> 
            <Icon as={element?FaExclamationCircle:FaCheckCircle} />
            <Text>{element?t('NotRead'):t('Any')}</Text>
        </Flex>)
    
    else if (column === 'status' && typeof element === 'string' && validStatuses.includes(element as Status)) return  <StateMap state={element as Status}/>
    else if (column === 'urgency_rating' && typeof element === 'number') {return <AlertLevel t={t} rating={element}/>}
    else if (column === 'created_at' || column === 'updated_at' || column === 'solved_at' || column === 'closed_at') {
        return(
        <Tooltip  label={timeStampToDate(element as string)}  placement='top' hasArrow bg='white' color='black'  borderRadius='.4rem' fontSize='sm' p='6px'> 
            <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{timeAgo(element as string)}</Text>
        </Tooltip>)
    }
    else if (column === 'deletion_date'  && typeof element === 'string' ) return <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{timeStampToDate(element)}</Text>
    else if (column === 'channel_type') {
        return(
        <Flex gap='7px' alignItems={'center'}>
            <Icon color='gray.600' as={typeof element === 'string' && element in logosMap ?logosMap[element as Channels][0]:FaInfoCircle}/>
            <Text >{t(element)}</Text>
         </Flex>)
    }     
    else return ( <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{element}</Text>)
}

//MAIN FUNCTION
const Table = ({ data, updateData, filters, section, maxWidth, selectedView, allIds, currentIndex = -1 }:TableProps ) =>{
     
    //TRANSLATION
    const { t } = useTranslation('tickets')

    //AUTH CONSTANT
    const auth = useAuth()
    const session = useSession()
    const isDeleteView = selectedView && selectedView.type === 'deleted'
    const navigate = useNavigate()
   
    const tableBoxRef = useRef<HTMLDivElement>(null)

    //DELETE TICKETS LIST LOGIC
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false)
    const [waitingDelete, setWaitingDelete] = useState<boolean>(false)
    
    //CALCULATE DYNAMIC HEIGHT OF TABLE
    const headerRef = useRef<HTMLDivElement>(null)
    const [alturaCaja, setAlturaCaja] = useState<number>(0)
    const [selectedIndex, setSelectedIndex] = useState<number>(currentIndex)
    useEffect(() => {setSelectedIndex(currentIndex)},[currentIndex])


    const [selectedElements, setSelectedElements] = useState<number[]>([])
    useEffect(() => {
        const actualizarAltura = () => {
            const alturaHeader = headerRef.current ? headerRef.current.getBoundingClientRect().bottom : 100;
            const alturaCalculada = (window.innerHeight -window.innerWidth * 0.02) - alturaHeader -  (selectedElements.length > 0 ?80:0)
            setAlturaCaja(alturaCalculada)
        }
        actualizarAltura()
        window.addEventListener('resize', actualizarAltura)
        return () => {window.removeEventListener('resize', actualizarAltura)}
    }, [selectedElements])


    //SCROLL ON CHANGING TO AN ELEMENT OUT OF THE SCROLL VIEW
    const scrollIntoView = (index: number) => {
        if (tableBoxRef.current) {
          const item = tableBoxRef.current.querySelector(`[data-index="${index}"]`)
          if (item) {
            const itemTop = (item as HTMLElement).offsetTop - tableBoxRef.current.getBoundingClientRect().top
            const itemBottom = itemTop + (item as HTMLElement).offsetHeight
            const containerTop = tableBoxRef.current.scrollTop
            const containerBottom = containerTop + tableBoxRef.current.offsetHeight
        
            if (itemTop < containerTop) tableBoxRef.current.scrollTop = itemTop
            else if (itemBottom > containerBottom) tableBoxRef.current.scrollTop = itemBottom - tableBoxRef.current.offsetHeight
        }
      }}
    
    //SHORTCUTS
    useEffect(() => {

        const handleKeyDown = (event:KeyboardEvent) => {
            if (event.code === 'ArrowUp') {
                setSelectedIndex(prev => {
                    const newIndex = Math.max(prev - 1, 0);
                    scrollIntoView(newIndex)
                    return newIndex
                  })
            }
            else if (event.code === 'ArrowDown') 
             setSelectedIndex(prev => {
                const newIndex = Math.min(prev + 1, (data?.length || 0) - 1);
                scrollIntoView(newIndex)
                return newIndex
              })
            else if (event.code === 'Space' && data && 0 <= selectedIndex && selectedIndex   <= data.length - 1) {
                handleCheckboxChange(data[selectedIndex].id, !selectedElements.includes(data[selectedIndex].id))
            }
            else if (event.code === 'Enter' && data) handleClickColumn(data[selectedIndex], selectedIndex)
        }
        
        window.addEventListener('keydown', handleKeyDown)

        return () => {window.removeEventListener('keydown', handleKeyDown)}
    }, [selectedElements, selectedIndex, data])


    //OBTAIN COLUMNS
    const excludeKeys = ['id', 'conversation_id', 'end_client_id',  'is_matilda_engaged']
    const columns = useMemo(() => {
        return data?.length
          ? Object.keys(data[0]).filter((key) => !excludeKeys.includes(key))
          : []
      }, [data])
    const totalWidth = useMemo(() => {return columns.reduce((acc, value) => acc + columnsTicketsMap[value as TicketColumn] + 20, 0) + 20}, [columns])

    //SELECT ROWS
    const handleCheckboxChange = (element:number, isChecked:boolean) => {
        if (isChecked) setSelectedElements(prevElements => [...prevElements, element])
        else setSelectedElements(prevElements => prevElements.filter(el => el !== element))
    }
  
    //SORT LOGIC
    const requestSort = (key: string) => {
        const direction = (filters.sort_by === key && filters.order === 'asc') ? 'desc' : 'asc';
        updateData({...filters, sort_by: key as TicketColumn, order: direction as 'asc' | 'desc'})
     }
    const getSortIcon = (header: string) => {
        if (filters.sort_by === header) return filters.order === 'asc' ? <IoMdArrowDropup size='20px' /> : <IoMdArrowDropdown size='20px' />
        return null
    }

    //NAVIGATE TO THE CLICKED TICKET AND SHOW IT IN THE HEADER
    const handleClickColumn  = (row:TicketsTableProps, index:number) => {
        session.dispatch({type:'UPDATE_TICKETS_TABLE_SELECTED_ITEM', payload:{view:{view_type:selectedView?.type, view_index:selectedView?.index}, index}})
        if (isDeleteView) {showToast({message:'No se puede acceder a un ticket de la papelera.', type:'failed'});return}
        navigate(`/tickets/ticket/${row.id}`) 
    }

    //FUNCTION FOR RECOVERING TICKETS FROM THE BIN
    const recoverTickets = async() => {
        session.dispatch({type:'DELETE_VIEW_FROM_TICKET_LIST'})
        await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets/bin/restore`,  auth, method:'post', requestForm:{ticket_ids:selectedElements},toastMessages:{'works':t('TicketsRecovered'),'failed':('TicketsRecoveredFailed')}})
        const responseOrg = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/user`, auth})
        auth.setAuthData({views: responseOrg?.data})
        updateData(null)
        setSelectedElements([])
    }

    //DELETE A TICKET
    const deleteTickets = async() => {
        session.dispatch({type:'DELETE_VIEW_FROM_TICKET_LIST'})
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets/bin`, setWaiting:setWaitingDelete, auth, method:'post', requestForm:{ticket_ids:selectedElements, days_until_deletion:30},toastMessages:{'works':t('TicketsTrash'),'failed':t('TicketsTrashFailed')}})
        if (response?.status === 200) {
            const responseOrg = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/user`, auth})
            auth.setAuthData({views: responseOrg?.data})
        }
        setShowConfirmDelete(false)
        updateData(null)
        setSelectedElements([])
    }

    //Component for confirming the deletio of elements
    const ConfirmDeleteBox = () => {
        
        const [showWaitingDeletePermanently, setShowWaitingDeletePermanently] = useState<boolean>(false)
        const deleteTicketsPermanently = async() => {
            if (isDeleteView) {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets/bin/delete`,  setWaiting:setShowWaitingDeletePermanently, auth:auth, method:'post', requestForm:{ticket_ids:selectedElements},toastMessages:{'works':t('TicketsDeleted'),'failed':t('TicketsDeletedFailed')}})
                const responseOrg = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/user`, auth})
                auth.setAuthData({views: responseOrg?.data})
                updateData(null)
                setSelectedElements([])
            }
        }

        return(<>
        <Box p='15px'> 
            <Text fontWeight={'medium'} fontSize={'1.2em'}>{'Confirmar eliminación'}</Text>
            <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
            <Text >Estás a punto de eliminar permanentemente {selectedElements.length > 1?'el':'los'} elemento{selectedElements.length > 1?'s':''}  seleccionado{selectedElements.length > 1?'s':''}. Esta acción <span style={{fontWeight:500}}> no se puede deshacer</span>. Una vez eliminados, no podrás recuperar los datos.</Text>
        </Box>
        <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
            <Button  size='sm' color='red' _hover={{color:'red.600', bg:'gray.200'}} onClick={deleteTicketsPermanently}>{showWaitingDeletePermanently?<LoadingIconButton/>:'Eliminar'}</Button>
            <Button  size='sm' onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
        </Flex>
    </>)
    }

    //Select all elments logic
    const selectAllElments = async(addElements:boolean) => {
        if (addElements) {
            if (allIds) setSelectedElements(allIds)
            else {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/all_ticket_ids`, auth, requestForm:{view_type:selectedView?.type, view_index:selectedView?.index}})
                if (response?.status === 200)setSelectedElements(response.data.ticket_ids)
            }
        }
        else setSelectedElements([])
    }

   
    //FRONT
    return(
        <> 
        {data === undefined || data.length === 0 ? 
            <Box borderRadius={'.5rem'} maxW={maxWidth} bg='gray.50' borderColor={'gray.200'} borderWidth={'1px'} p='15px'>    
                <Text fontWeight={'medium'} fontSize={'1.1em'}>No hay tickets disponibles</Text>
            </Box>: 
        <Box  overflow={'scroll'} maxW={maxWidth} >    
            <Flex position={'sticky'} borderTopRadius={'.5rem'} minWidth={`${totalWidth}px`}  borderColor={'gray.300'} borderWidth={'1px'} gap='20px' ref={headerRef} alignItems={'center'}  color='gray.500' p='10px' fontSize={'1em'} bg='gray.100' fontWeight={'medium'}> 
                {section === 'tickets' && <Flex alignItems={'center'} width='10px' > 
                    <Checkbox isChecked={selectedElements.length >= data.length} onChange={(e) => selectAllElments(e?.target?.checked)}/>  
                </Flex>}
                {Object.keys(columnsTicketsMap).filter(column => column !== 'id').map((column) => (
                <Fragment key={`header-${column}`}>
                    {column in data[0] &&
                        <Flex alignItems={'center'} flex={`${columnsTicketsMap[column as TicketColumn]/10} 0 ${columnsTicketsMap[column as TicketColumn]}px`}> 
                        <Text cursor='pointer' onClick={() => requestSort(column)}>{t(column)}</Text>
                        {getSortIcon(column)}
                    </Flex>}
                </Fragment>))}
            </Flex>
            <Box minWidth={`${totalWidth}px`} overflowX={'hidden'} ref={tableBoxRef} overflowY={'scroll'} maxH={alturaCaja}> 
                {data.map((row:TicketsTableProps, index:number) =>( 
                    <Flex data-index={index}  position={'relative'} overflow={'hidden'} gap='20px' minWidth={`${totalWidth}px`} borderRadius={index === data.length - 1?'0 0 .5rem .5rem':'0'} borderWidth={'0 1px 1px 1px'}  cursor={isDeleteView?'not-allowed':'pointer'} onClick={() => handleClickColumn(row, index)} key={`row-${index}`}  bg={selectedIndex === index ? 'blue.50':selectedElements.includes(row.id)?'blue.100':index%2 === 1?'#FCFCFC':'white'} alignItems={'center'}  fontSize={'.9em'} color='black' p='10px' borderBottomWidth={'1px'} borderColor={'gray.300'} _hover={{bg:selectedElements.includes(row.id)?'blue.100':'blue.50'}}  > 
                         {selectedIndex === index && <Box position='absolute' left={0} top={0} height={'100%'} width={'2px'} bg='blue.400'/>}
                         {section === 'tickets' && <Flex alignItems={'center'} onClick={(e) => e.stopPropagation()}> 
                            <Checkbox onChange={(e) => handleCheckboxChange(row.id, e.target.checked)} isChecked={selectedElements.includes(row.id)}/>  
                        </Flex>}
                        {Object.keys(columnsTicketsMap).filter(column => column !== 'id').map((column:string, index:number) => (<Fragment key={`header-${column}`}>
                            {column in row &&
                                <Flex minW={0} alignItems={'center'} flex={`${columnsTicketsMap[column as TicketColumn]/10} 0 ${columnsTicketsMap[column as TicketColumn]}px`}> 
                                    <CellStyle t={t} column={column as TicketColumn} element={row[column]} auth={auth}/>
                                </Flex>}
                            </Fragment>))}
                       
                    </Flex>
                ))}
            </Box>
        </Box>
    }
    <AnimatePresence> 
            {selectedElements.length > 0 && 
            <motion.div initial={{bottom:-200}} animate={{bottom:0}} exit={{bottom:-200}} transition={{duration:.2}} style={{backgroundColor:'#F7FAFC',display:'flex', justifyContent:'space-between', alignItems:'center',padding:'0 2vw 0 2vw', height:'80px', gap:'20px',position:'fixed', marginLeft:'-2vw',  borderTop:' 1px solid #E2E8F0', overflow:'scroll', width:`calc(100vw - 380px)`}}>
                <Flex gap='1vw' alignItems={'center'}> 
                    <Text whiteSpace={'nowrap'} fontWeight={'medium'}>{selectedElements.length} ticket{selectedElements.length > 1 ? 's':''}</Text>
                    <Button onClick={() => setSelectedElements([])} size='sm' bg='transparent' borderColor={'transparent'} color='blue.400' _hover={{bg:'gray.100', color:'blue.500'}} leftIcon={<MdDeselect/>}>Deseleccionar</Button> 
                    {isDeleteView ? 
                        <Button  size='sm' bg='transparent' borderColor={'transparent'} color='blue.400' _hover={{bg:'gray.100', color:'blue.500'}} leftIcon={<FaArrowRotateLeft/>} onClick={recoverTickets}>Recuperar</Button>
                    :
                        <> {selectedElements.length <= 1 && !isDeleteView && <Button onClick={() => `/tickets/ticket/${selectedElements[0]}`} size='sm' bg='transparent' borderColor={'transparent'} color='blue.400' _hover={{bg:'gray.100', color:'blue.500'}} leftIcon={<BiEditAlt/>}>Editar</Button>}</>
                    } 
                    <Button size='sm' onClick={() => {if (isDeleteView) setShowConfirmDelete(true);else{deleteTickets()}}} bg='transparent' borderColor={'transparent'} color='red.500' _hover={{bg:'gray.100', color:'red.700'}}leftIcon={<BsTrash3Fill/>}>{waitingDelete?<LoadingIconButton/>:isDeleteView?'Eliminar':'Enviar a la Papelera'}</Button>
                </Flex>
                <Button sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }} size='sm' color='red' onClick={() => setSelectedElements([])} _hover={{color:'red.700'}}>Cancelar</Button>
            </motion.div>}
        </AnimatePresence>

      {showConfirmDelete && 
        <ConfirmBox setShowBox={setShowConfirmDelete}> 
               <ConfirmDeleteBox/>
        </ConfirmBox>}

    </> )
}

export default Table
 