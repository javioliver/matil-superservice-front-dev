/*
  MAIN TICKETS FUNCTION (/tickets)
*/

//REACT
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../AuthContext" 
import { useSession } from "../../../SessionContext"
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../API/fetchData"
import LoadingIconButton from "../../Components/LoadingIconButton"
//FRONT
import { Flex, Box, Text, Icon, Button, IconButton, Skeleton } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//COMPONENTS
import Table from "./Table"
import ActionsButton from "./ActionsButton"
import EditText from "../../Components/EditText"
//FUNCTIONS
import DetermineTicketViews from "../../MangeData/DetermineTicketViews"
//ICONS
import { FaRegEdit } from "react-icons/fa"
import { HiMiniAdjustmentsHorizontal } from "react-icons/hi2"
import { RxCross2 } from "react-icons/rx"
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io"
import { BsTrash3Fill } from "react-icons/bs"
//TYPING
import { Tickets, TicketColumn, Views, ViewType, TicketsTableProps } from "../../Constants/typing"
 
interface TicketFilters {
    page_index:number
    sort_by?:TicketColumn | 'not_selected'
    search?:string, order?:'asc' | 'desc'
}

//FUNCTION FOR GET THE FIRST VIEW
const getFirstView = (views:Views) => {
    if ('private_views' in views && views.private_views.length > 0) return {type:'private', index:0, name:views.private_views[0].name}
    else if ('shared_views' in views && views.shared_views.length > 0) return {type:'shared', index:0, name:views.shared_views[0].name}
}
 
//MAIN FUNCTION
function TicketsTable({socket}:{socket:any}) {

    //TRANSLATION
    const { t } = useTranslation('tickets')

    //CONSTANTS
    const auth = useAuth()
    const session= useSession()
    const navigate = useNavigate()
  
    //WAIT INFO AND FORCE TH REUPDATE OF THE TABLE ON DELETE
    const [waitingInfo, setWaitingInfo] = useState<boolean>(true)

    //SHOW FILTERS AND FILTERS INFO
    const [filters, setFilters ] = useState<TicketFilters>({page_index:1}) 
    const [showFilters, setShowFilters] = useState<boolean>(false)
    
    //TICKET DATA AND SELECTED VIEW
    const [tickets, setTickets] = useState<Tickets | null>(null)
    const [selectedView, setSelectedView] = useState<ViewType>((localStorage.getItem('currentView') && JSON.parse(localStorage.getItem('currentView') as string)) || getFirstView(auth.authData.views as Views))
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)

 
    //SOCKET FOR RELOADING VIEWS ON A NEW TICKET
    useEffect(() => {

        document.title = `Tickets - ${selectedView.name} - ${auth.authData.organizationName} - Matil`
        localStorage.setItem('currentSection', 'tickets')

        setSelectedView(localStorage.getItem('currentView') && JSON.parse(localStorage.getItem('currentView') as string) || getFirstView(auth.authData.views as Views))

        socket?.current.on('ticket', (data:any) => {
            
                const previousViews = DetermineTicketViews(data?.previous_data, auth.authData.views as Views, auth.authData?.userId || -1)
                const newViews = DetermineTicketViews(data?.new_data, auth.authData.views as Views, auth.authData?.userId || -1)
                
                const combinedViews = previousViews.concat(newViews)

                for (const view of combinedViews) {
                  if (view.view_type === selectedView.type && view.view_index === selectedView.index) {
                    fetchTicketDataWithFilter(null)
                    break
                  }
            }
        })
    },[JSON.stringify(auth.authData.organizationId)])

    //FETCH NEW DATA WHEN THE VIEW CHANGE
    useEffect(() => {
        const fetchTicketData = async() => {

            //FIND IF THE SECTION IS OPENED
            const ticketsList = session.sessionData.ticketsTable
            const foundTicket = ticketsList.find(ticket => ticket.view.view_type === selectedView.type && ticket.view.view_index === selectedView.index)

            //SECTION FOUND
            if (foundTicket){
                setTickets(foundTicket.data)
                setFilters(foundTicket.filters)
                setSelectedIndex(foundTicket.selectedIndex || -1)
                setWaitingInfo(false)
            } 

            //SECTION NOT FOUND (FETCH THE DATA)
            else {

                //CLEAR THE FILTERS
                setFilters({page_index:1})
                setSelectedIndex(-1)
                
                //CALL THE BIN
                if (selectedView.type === 'deleted') {
                    const response1 = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets/bin`, setValue:setTickets, setWaiting:setWaitingInfo, params:{page_index:1}, auth})
                    if (response1?.status === 200) {      
                        const newTicket:{data:TicketsTableProps[] | null, view:{view_type:'shared' | 'private' | 'deleted', view_index:number}, selectedIndex:number, filters:TicketFilters} = 
                        {data:response1.data, view: {view_type: selectedView.type, view_index: selectedView.index}, filters: {page_index:1}, selectedIndex:-1}
                        session.dispatch({ type: 'UPDATE_TICKETS_TABLE', payload: newTicket })
                    }
                }

                //CALL A NORMAL TICKET VIEW
                else {
                    const response2 = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, setValue:setTickets, setWaiting:setWaitingInfo, params:{page_index:1, view_type:selectedView.type, view_index:selectedView.index}, auth})
                    if (response2?.status === 200) {
                        const newTicket:{data:TicketsTableProps[] | null, view:{view_type:'shared' | 'private' | 'deleted', view_index:number}, selectedIndex:number, filters:TicketFilters} = 
                        {data:response2.data, view: {view_type: selectedView.type, view_index: selectedView.index}, selectedIndex:-1, filters: {page_index:1}}
                        session.dispatch({ type: 'UPDATE_TICKETS_TABLE', payload: newTicket })
                    }
                }
            }
        }
        fetchTicketData()
    }, [selectedView])

    //FETCH NEW DATA ON FILTERS CHANGE
    const fetchTicketDataWithFilter = async (applied_filters:{page_index:number, sort_by?:TicketColumn | 'not_selected', search?:string, order?:'asc' | 'desc'} | null) => {
        
        //APPLY FILTERS
        let selectedFilters:TicketFilters
        if (applied_filters === null) selectedFilters = filters
        else {
            selectedFilters = {...filters, ...applied_filters}
            setFilters(filters)
        }

        //CHOOSE CONFIGURATION DEPENDING ON ITS BIN OR A NORMAL VIEW
        let endpoint = `superservice/${auth.authData.organizationId}/tickets`
        let viewsToSend:{view_type:string, view_index:number} | {} = {view_type:selectedView.type, view_index:selectedView.index}
        if (selectedView.type === 'deleted') {endpoint = `superservice/${auth.authData.organizationId}/tickets/bin`;viewsToSend = {}}
        
        //API CALL
        const response = await fetchData({endpoint, setValue:setTickets, setWaiting:setWaitingInfo, params:{...viewsToSend, ...selectedFilters}, auth})
        if (response?.status === 200) {
            setFilters(selectedFilters)
            const newTicket:{data:TicketsTableProps[] | null, view:{view_type:'shared' | 'private' | 'deleted', view_index:number}, selectedIndex:number, filters:{page_index:number, sort_by?:TicketColumn | 'not_selected', search?:string, order?:'asc' | 'desc'}} = 
            {data:response.data, view: {view_type: selectedView.type, view_index: selectedView.index}, selectedIndex:-1, filters: selectedFilters}
            session.dispatch({ type: 'UPDATE_TICKETS_TABLE', payload: newTicket })
         }
    }

    //FILTERS COMPONENT
    const Filters = () => {
        
        //SCROLL REF
        const scrollRef = useRef<HTMLDivElement>(null)

        //FILTERS
        const [text, setText] = useState<string>(filters.search || '')
        
        //WAITING SEND FILTERS
        const [waitingSendFilters, setWaitingSendFilters] = useState<boolean>(false)

        //SEND FILTERS (CURRENTLY THERE IS ONLY TEXT FILGTER)
        const sendFilters = async () => {
            setWaitingSendFilters(true)
            let filtersDict:TicketFilters  = {
                page_index:1,
                search:text,
            }

            await fetchTicketDataWithFilter(filtersDict)
            setWaitingSendFilters(false)
            setFilters(filtersDict)
            setShowFilters(false)   
         }

        //FILTERS BAR FRONT
        return (
            <>
                <Box ref={scrollRef} overflowY={'scroll'} height={'100%'} px='3px'  >
                    <Flex justifyContent={'space-between'} alignItems={'center'}>
                        <Text fontWeight={'medium'} fontSize='1.2em'>{t('Filter')}</Text>
                        <IconButton icon={<RxCross2 />} aria-label='hide-filters' onClick={() => setShowFilters(false)} size='sm' isRound bg='transparent' borderWidth={'0px'} />
                    </Flex>
                    <Box width={'100%'} mt='2vh' mb='2vh'  height={'1px'} bg='gray.300' />
                    <Text fontSize={'1em'} mb='1vh' fontWeight={'medium'}>{t('TextMatch')}</Text>
                    <EditText value={text} setValue={setText} searchInput={true} />
                </Box>
                <Box>
                    <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300' />
                    <Flex flexDir={'row-reverse'} gap='20px'>
                        <Button size='sm' onClick={sendFilters} bg='brand.gradient_blue' color='white' _hover={{bg:'brand.gradient_blue_hover'}}>{waitingSendFilters?<LoadingIconButton/>:t('ApplyFilters')}</Button>
                        <Button size='sm' color='red' _hover={{ color: 'red.600' }} onClick={() => setShowFilters(false)}>{t('Cancel')}</Button>
                    </Flex>
                </Box>
            </>
        )
      }
    
    //FRONT
    return(<> 
        <Flex height={'calc(100vh - 60px)'} color='black' width={'100%'}>
    
        {/*VIEWS SELECTION*/}
        <Flex zIndex={100}  px='1vw' gap='20px' py='2vh' bg='gray.50' width={'320px'} flexDir={'column'} justifyContent={'space-between'} borderRightWidth={'1px'} borderRightColor='gray.200' >
            <Flex justifyContent={'space-between'} flexDir={'column'} flex='1' minH={0}>  
                <Box> 
                    <Text fontSize={'1.4em'} fontWeight={'medium'}>{t('Views')}</Text>
                    <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
                </Box>
                <Box height={'100px'} flex='1' overflow={'scroll'}>
                     {(auth.authData.views && 'private_views' in auth.authData.views && auth.authData.views.private_views.length > 0 ) && <>
                        <Text fontSize='1.1em' fontWeight={'medium'} mb='1vh'>{t('PrivateViews')}</Text>
                        <Box mb='4vh'> 
                            {auth.authData.views.private_views.map((view, index) => {
                                const isSelected = selectedView.index === index && selectedView.type === 'private'
                                return(
                                    <Flex justifyContent='space-between' key={`private-view-${index}`} onClick={() => {setSelectedView({index:index, type:'private', name:view.name});localStorage.setItem('currentView', JSON.stringify({index:index, type:'private', name:view.name}))}}   _hover={{bg:isSelected?'blue.100':'gray.200'}} bg={isSelected? 'blue.100':'transparent'} fontWeight={isSelected? 'medium':'normal'} fontSize={'1em'} cursor={'pointer'} borderRadius={'.5rem'} p='10px'>
                                        <Text>{view.name}</Text>
                                        <Text>{auth.authData.views?.number_of_tickets_per_private_view?.[index] || 0}</Text>
                                    </Flex>
                                    )
                            })}
                        </Box>
                    </>}
                    {(auth.authData.views && 'shared_views' in auth.authData.views && auth.authData.views.shared_views.length > 0 ) &&   <>
                        <Text fontSize='1.1em' fontWeight={'medium'} mb='1vh' >{t('PublicViews')}</Text>
                        <Box> 
                            {auth.authData.views.shared_views.map((view, index) => {
                            const isSelected = selectedView.index === index && selectedView.type === 'shared'
                            return(
                                <Flex justifyContent='space-between' key={`shared-view-${index}`} onClick={() => {setSelectedView({index:index, type:'shared', name:view.name}); localStorage.setItem('currentView', JSON.stringify({index:index, type:'shared', name:view.name}))}} _hover={{bg:isSelected?'blue.100':'gray.200'}} bg={isSelected? 'blue.100':'transparent'} fontWeight={isSelected? 'medium':'normal'}fontSize={'1em'} cursor={'pointer'} borderRadius={'.5rem'} p='10px'>
                                    <Text>{view.name}</Text>
                                    <Text>{auth.authData.views?.number_of_tickets_per_shared_view?.[index] || 0}</Text>
                                </Flex>
                                )
                            })}
                        </Box>
                    </>}
                </Box>
            </Flex>

            <Box>
                <Flex  color='red' onClick={() => {setSelectedView({index:0, type:'deleted', name:'Papelera'}); localStorage.setItem('currentView', JSON.stringify({index:0, type:'deleted', name:'Papelera'}))}} justifyContent={'space-between'} _hover={{bg:selectedView.type === 'deleted'?'blue.100':'gray.200'}} bg={selectedView.type === 'deleted'? 'blue.100':'transparent'} fontWeight={selectedView.type === 'deleted'? 'medium':'normal'}fontSize={'1em'} cursor={'pointer'} borderRadius={'.5rem'} p='8px'>
                    <Flex gap='10px' alignItems={'center'}> 
                        <Icon boxSize={'12px'} as={BsTrash3Fill}/>
                        <Text mt='2px' >{t('Trash')}</Text>
                    </Flex>
                    <Text>{auth.authData.views?.number_of_tickets_in_bin || 0}</Text>
                </Flex>

                <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300' />
                <Flex mb='1vh' height={'25px'} onClick={() => navigate('/settings/people/edit-views')} color='blue.600' alignItems={'center'} mt='2vh' gap='7px' cursor={'pointer'} _hover={{color:'blue.700', textDecor:'underline'}}> 
                    <Text fontSize={'.9em'} ml='7px'>{t('EditViews')}</Text>
                    <Icon as={FaRegEdit} boxSize={'13px'}/>
                </Flex>
            </Box>
        </Flex>

         {/* ACTIONS AND SHOW TABLE */}
         <Box p='2vw' width={'calc(100vw - 380px)'}bg='white'>
            <Flex justifyContent={'space-between'} gap='10px'>
                <Text flex='1' minW={0} fontWeight={'medium'} fontSize={'1.5em'} whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{selectedView.name}</Text>
                <ActionsButton items={tickets?.page_data} view={selectedView} section={'tickets'} />
            </Flex>
            <Button mt='2vh' onClick={() => {setShowFilters(true) }} leftIcon={<HiMiniAdjustmentsHorizontal />} fontSize={'1em'} size='sm' fontWeight={'medium'}  _hover={{ color: 'blue.500' }}>{t('Filter')}</Button>
            
            <Skeleton  isLoaded={!waitingInfo} >
                <Text mt='2vh'>{tickets?.total_tickets} ticket{tickets?.total_tickets === 1 ? '' : 's'}</Text> 
            </Skeleton >
            <Box>
                <Flex p='10px' alignItems={'center'} justifyContent={'end'} gap='10px' flexDir={'row-reverse'}>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowForward />} isDisabled={filters.page_index > Math.floor((tickets?.total_tickets || 0)/ 25)} onClick={() => fetchTicketDataWithFilter({...filters,page_index:filters.page_index + 1})}/>
                    <Text fontWeight={'medium'} fontSize={'.9em'} color='gray.600'>Página {filters.page_index}</Text>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowBack />} isDisabled={filters.page_index === 1} onClick={() => fetchTicketDataWithFilter({...filters,page_index:filters.page_index - 1})}/>
                </Flex>
                <Skeleton isLoaded={!waitingInfo}>
                    <Table data={tickets?.page_data} allIds={tickets?.ticket_ids} updateData={fetchTicketDataWithFilter} filters={filters} currentIndex={selectedIndex} maxWidth="calc(96vw - 380px)" section={'tickets'}  selectedView={selectedView}/> 
                </Skeleton >             
            </Box>
         </Box>

            {/*FILTERS BOX*/}
            <AnimatePresence> 
                {showFilters &&
                <> 
                    <motion.div initial={{right:-400}} onMouseDown={(e)=>{e.stopPropagation()}} animate={{right:0}}  exit={{right:-400}} transition={{ duration: .15 }} style={{position: 'fixed',top: 0,width: '400px',height: '100vh',padding:'2vh 1vw 1vw 2vh',backgroundColor: 'white',zIndex: 201, display:'flex',justifyContent:'space-between',flexDirection:'column'}}> 
                        <Filters/>
                    </motion.div>
                    <motion.div initial={{opacity:0}} onMouseDown={()=>setShowFilters(false)} animate={{opacity:1}} exit={{opacity:0}}   transition={{ duration: .3 }} style={{backdropFilter: 'blur(1px)',WebkitBackdropFilter: 'blur(1px)',position: 'fixed',top: 0,left: 0,width: '100vw',height: '100vh',backgroundColor: 'rgba(0, 0, 0, 0.3)',zIndex: 200}}/>
                </>}
            </AnimatePresence>

        </Flex>
        
        </>
    
        )
}

export default TicketsTable