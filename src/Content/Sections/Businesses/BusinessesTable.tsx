//REACT
import { useState, useEffect, useRef, Fragment, useMemo } from "react"
import { useNavigate } from 'react-router-dom'
import { useAuth } from "../../../AuthContext" 
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Box, Text, Tooltip, Button, IconButton, Skeleton } from '@chakra-ui/react'
//COMPONENTS
import EditText from "../../Components/EditText"
import AccionesButton from "../Tickets/ActionsButton"
//FUNCTIONS
import timeAgo from "../../Functions/timeAgo"
import timeStampToDate from "../../Functions/timeStampToString"
//ICONS
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6" 
import { IoIosArrowBack, IoIosArrowForward, IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io"
//TYPING
import { ContactBusinessesProps, columnsBusinessesMap,  HeaderSectionType } from "../../Constants/typing"
import { useSession } from "../../../SessionContext"
import ConfirmBox from "../../Components/ConfirmBox"
import CreateBusiness from "./CreateBusiness"


//MAIN FUNCTION
function ContactBusinessesTable ({addHeaderSection}:{addHeaderSection:HeaderSectionType}) {

    //AUTH CONSTANT
    const auth = useAuth()
    const session = useSession()

    //NAVIGATE CONSTANT
    const navigate = useNavigate()

    //CONTAINER REF
    const containerRef = useRef<HTMLDivElement>(null)
    const tableBoxRef = useRef<HTMLDivElement>(null)

    //BOOLEAN FOR WAIT THE INFO
    const [waitingInfo, setWaitingInfo] = useState<boolean>(true)

    //CREATE NEW BUSINESS
    const [showCreateBusiness, setShowCreateBusiness] = useState<boolean>(false)
    
    //SELECT DATA LOGIC
    const [businesses, setBusinesses] = useState<ContactBusinessesProps | null>(null)
    const [filters, setFilters] = useState<{page_index:number, search?:string, sort_by?:string, order?:'asc' | 'desc'}>({page_index:1})
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)


    //FETCH DATA ON FIRST RENDER
    useEffect(() => {
        document.title = `Empresas de Contacto - ${auth.authData.organizationName} - Matil`
        localStorage.setItem('currentSection', `contact-businesses`)

        const fetchBusinessessData = async() => {
            if (session.sessionData.contactBusinessesTable) {
                setBusinesses(session.sessionData.contactBusinessesTable.data)
                setFilters(session.sessionData.contactBusinessesTable.filters)
                setSelectedIndex(session.sessionData.contactBusinessesTable.selectedIndex)
                setWaitingInfo(false)
            }
            else {
                const businessResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses`, setValue:setBusinesses, setWaiting:setWaitingInfo, params:{page_index:1},auth:auth})
                if (businessResponse?.status === 200) session.dispatch({type:'UPDATE_BUSINESSES_TABLE',payload:{data:businessResponse?.data, filters, selectedIndex:-1}})
            }
        }    
        fetchBusinessessData()
    }, [])
 
     
    const scrollIntoView = (index: number) => {

        if (tableBoxRef.current) {
          const item = tableBoxRef.current.querySelector(`[data-index="${index}"]`)
          if (item) {
            const itemTop = (item as HTMLElement).offsetTop - tableBoxRef.current.getBoundingClientRect().top
            const itemBottom = itemTop + (item as HTMLElement).offsetHeight
            const containerTop = tableBoxRef.current.scrollTop
            const containerBottom = containerTop + tableBoxRef.current.offsetHeight
        
            console.log(itemTop)
            console.log(itemBottom)

            if (itemTop < containerTop) tableBoxRef.current.scrollTop = itemTop
            else if (itemBottom > containerBottom) tableBoxRef.current.scrollTop = itemBottom - tableBoxRef.current.offsetHeight
        }
      }}

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
                const newIndex = Math.min(prev + 1, (businesses?.page_data?.length || 0) - 1);
                scrollIntoView(newIndex)
                return newIndex
              })
         
            else if (event.code === 'Enter' && businesses?.page_data) navigate(`/contact-businesses/business/${businesses?.page_data?.[selectedIndex]?.id}`)
        }
        
        window.addEventListener('keydown', handleKeyDown)

        return () => {window.removeEventListener('keydown', handleKeyDown)}
    }, [selectedIndex, businesses?.page_data])

      
    //FETCH NEW DATA ON FILTERS CHANGE
    const fetchBusinessDataWithFilter = async (new_filters:{page_index:number, sort_by?:string, search?:string, order?:'asc' | 'desc'} | null) => {
    
         const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses`, setValue:setBusinesses, setWaiting:setWaitingInfo, params:new_filters?new_filters:filters, auth})
        if (response?.status === 200) {            
            session.dispatch({ type: 'UPDATE_BUSINESSES_TABLE', payload: {data:response.data, filters:filters} })
            if (new_filters) setFilters(new_filters)
         }
    }

    //SORT BY AND SHOW ICON LOGIC
    const requestSort = (key: string) => {
        const direction = (filters.sort_by === key && filters.order === 'asc') ? 'desc' : 'asc';
        fetchBusinessDataWithFilter({...filters, sort_by: key, order: direction as 'asc' | 'desc'})
     }
    const getSortIcon = (header: string) => {
        if (filters.sort_by === header) return filters.order === 'asc' ? <IoMdArrowDropup size='20px' /> : <IoMdArrowDropdown size='20px' />
        return null
    }

    const rowClick = (id:number, index:number) => {
        session.dispatch({type:'UPDATE_BUSINESSES_TABLE_SELECTED_ITEM', payload:{index}})
        navigate(`/contact-businesses/business/${id}`)
    }

    
    //GET THE CELL STYLE
    const CellStyle = ({ column, element }:{column:string, element:any}) => {
     
        if (column === 'created_at' || column === 'last_interaction_at' )  
        return(
            <Tooltip  label={timeStampToDate(element as string)}  placement='top' hasArrow bg='white' color='black'  borderRadius='.4rem' fontSize='sm' p='6px'> 
                <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{timeAgo(element as string)}</Text>
            </Tooltip>)
        else if (column === 'labels') {
            return(<> 
                {(!element || element === '')?<Text>-</Text>:
                <Flex gap='5px' flexWrap={'wrap'}>
                    {element.split(',').map((label:string, index:number) => (
                    <Flex bg='gray.200' borderColor={'gray.300'} borderWidth={'1px'} p='4px' borderRadius={'.5rem'} fontSize={'.8em'} key={`client-label-${index}`}>
                        <Text>{label}</Text>
                    </Flex>
                    ))}
                </Flex>}
            </>)
        }
        else return ( <Text whiteSpace={'nowrap'} fontWeight={column === 'name'?'medium':'normal' } textOverflow={'ellipsis'} overflow={'hidden'}>{element === ''?'-':element}</Text>)
    }

    
    const memoizedCreateBusiness = useMemo(() => (
        <ConfirmBox setShowBox={setShowCreateBusiness}>
            <CreateBusiness setShowBox={setShowCreateBusiness} actionTrigger={(data:any) => fetchBusinessDataWithFilter(null)}/>
        </ConfirmBox>
    ), [showCreateBusiness])

    //FRONT
    return(<>
        {showCreateBusiness && memoizedCreateBusiness}

        <Box bg='white' height={'calc(100vh - 60px)'} maxW={'calc(100vw - 60px)'} overflowX={'scroll'} overflowY={'hidden'} p='2vw'>
    
            {/*FILTRAR LA TABLA*/}
            <Flex justifyContent={'space-between'} alignItems={'end'}> 
                <Text fontWeight={'medium'} fontSize={'1.5em'}>Empresas de Contacto</Text>
                <AccionesButton items={businesses ? businesses.page_data:[]} view={null} section={'clients'}/>
             </Flex>
            <Flex justifyContent={'space-between'} alignItems={'end'} gap='20px'  > 
                <Flex gap='20px' alignItems={'center'} mt='3vh' flex='1' ref={containerRef} px='4px' overflowX={'scroll'}>
                    <Box minW='200px' width={'300px'} alignItems={'center'} >
                        <EditText value={filters.search} setValue={(value:string) => setFilters({...filters, search:value})} searchInput={true}/>
                    </Box> 
                    <Button whiteSpace='nowrap'  minWidth='auto'leftIcon={<FaMagnifyingGlass/>} size='sm' onClick={() => fetchBusinessDataWithFilter({...filters,page_index:1})}>Aplicar filtros</Button>
                </Flex>
                <Button whiteSpace='nowrap'  minWidth='auto'leftIcon={<FaPlus/>} size='sm' onClick={() =>setShowCreateBusiness(true)}>Crear Empresa</Button>

             </Flex>
            <Box bg={'gray.200'} height={'1px'} mt='3vh' mb='3vh' width='100%'/>

            <Skeleton isLoaded={!waitingInfo}> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>{businesses?.total_contact_businesses} Empresa{businesses?.total_contact_businesses == 1 ? '':'s'}</Text>
            </Skeleton>
            
            {/*TABLA*/}
            <Box> 
                <Flex p='10px' alignItems={'center'} justifyContent={'end'} gap='10px' flexDir={'row-reverse'}>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowForward />} isDisabled={filters.page_index >= Math.floor((businesses?.total_contact_businesses || 0)/ 50)} onClick={() => fetchBusinessDataWithFilter({...filters,page_index:filters.page_index + 1})}/>
                    <Text fontWeight={'medium'} fontSize={'.9em'} color='gray.600'>Página {filters.page_index}</Text>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowBack />} isDisabled={filters.page_index === 1} onClick={() => fetchBusinessDataWithFilter({...filters,page_index:filters.page_index - 1})}/>
                </Flex>
            
                <Skeleton isLoaded={!waitingInfo}> 
                <Box maxW={'calc(96vw - 60px)'} ref={tableBoxRef} overflow={'scroll'} >
                
                {businesses?.page_data.length === 0 ? 
                    <Flex borderRadius={'.5rem'}  bg='gray.50' borderColor={'gray.200'} borderWidth={'1px'} p='15px'>    
                        <Text fontWeight={'medium'} fontSize={'1.1em'}>No hay empresas de contacto disponibles</Text>
                    </Flex>:
                     <> 
                        <Flex  borderColor={'gray.300'}  borderTopRadius={'.5rem'} borderWidth={'1px'} minWidth={`1760px`}  gap='20px' alignItems={'center'}  color='gray.500' p='10px' fontSize={'.9em'} bg='gray.100' fontWeight={'medium'}> 
                            {Object.keys(columnsBusinessesMap).map((column, index) => (<Fragment key={`businesses-header-${index}`}> 
                                
                                {(column !== 'id' && column !== 'contact_business_id' && column !== 'email_address' && column !== 'instagram_username' && column !== 'webchat_uuid' && column !== 'phone_number') && 
                                    <Flex key={`business-header-${index}`} gap='2px' alignItems={'end'} flex={`${columnsBusinessesMap[column]/10} 0 ${columnsBusinessesMap[column]}px`}> 
                                        <Text cursor='pointer' onClick={() => requestSort(column)}>{columnsBusinessesMap[column]}</Text>
                                        {getSortIcon(column)}
                                    </Flex>
                                }
                            </Fragment>))}
                        </Flex>
                        {businesses?.page_data.map((row:any, index) =>( 
                            <Flex  data-index={index} cursor={'pointer'} overflow={'hidden'} onClick={() => rowClick(row.id, index)}  key={`business-row-${index}`} borderRadius={index === businesses?.page_data.length - 1?'0 0 .5rem .5rem':'0'} borderWidth={'0 1px 1px 1px'} borderColor={'gray.300'} bg={index%2 === 1?'#FCFCFC':'white'} gap='20px' minWidth={`1760px`} alignItems={'center'}  fontSize={'.9em'} color='black' p='10px' _hover={{bg:'blue.50'}} > 
                                {Object.keys(columnsBusinessesMap).map((column:string, index2:number) => (
                                    <Fragment  key={`business-cell-${index}-${index2}`} > 
                                        {(column !== 'id' && column !== 'contact_business_id' && column !== 'email_address' && column !== 'instagram_username' && column !== 'webchat_uuid' && column !== 'phone_number') && 
                                        <Flex  key={`business-cell-${index}-${index2}`}  gap='2px' alignItems={'end'} flex={`${columnsBusinessesMap[column]/10} 0 ${columnsBusinessesMap[column]}px`}> 
                                            <CellStyle column={column} element={row[column]} />
                                        </Flex>}
                                </Fragment>))}
                            </Flex>
                        ))}      
                    </>
                }
                    </Box>
                </Skeleton>
            </Box>
    
        </Box>
        </>)
}

export default ContactBusinessesTable

 