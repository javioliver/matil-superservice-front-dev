/* 
    MAIN COMPONENT. CONTAINS THE HEADER, THE SIDEBAR AND THEIR FUNCTIONALITITES
*/

//REACT
import { useRef, useState, useEffect, useLayoutEffect, ElementType, Suspense, lazy, SetStateAction, Dispatch, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from '../AuthContext'
import { useSession } from '../SessionContext'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from './API/fetchData'
import io from 'socket.io-client'
//FRONT
import { Flex, Box, Icon, Avatar, Text, Tooltip, Image, Button, IconButton } from '@chakra-ui/react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import './Components/styles.css'
import { motion, AnimatePresence } from 'framer-motion' 
//COMPONENTS
import LoadingIconButton from './Components/LoadingIconButton'
import LoadingIcon from './Components/LoadingIcon'
import showToast from './Components/ToastNotification'
import EditText from './Components/EditText'
import ConfirmBox from './Components/ConfirmBox'
import CallWidget from './Components/CallWidget'
import ShortCutsList from './Components/ShortCutsList'
import SendFeedBack from './Components/SendFeedback'
//FUNCTIONS
import useOutsideClick from './Functions/clickOutside'
import DetermineTicketViews from './MangeData/DetermineTicketViews'
//ICONS
import { IoFileTrayFull, IoChatboxOutline, IoPersonOutline } from "react-icons/io5" 
import { BsFillPersonLinesFill, BsBarChartFill, BsBuildings, BsFillTelephoneInboundFill, BsFillTelephoneMinusFill, BsFillTelephoneXFill } from "react-icons/bs"
import { FaPlus, FaArrowRightToBracket } from "react-icons/fa6"
import { IoIosSettings, IoIosArrowDown } from "react-icons/io"
import { RxCross2 } from "react-icons/rx"
import { FiPlus } from "react-icons/fi"
import { BiSolidBuildings } from 'react-icons/bi'
import { PiBuildingApartmentFill, PiKeyReturn } from "react-icons/pi"
import { TbArrowBack } from 'react-icons/tb'
import { VscFeedback } from "react-icons/vsc"
import { TiFlowMerge } from "react-icons/ti"
//TYPING 
import { Organization, TicketData, userInfo, Views } from './Constants/typing'
import { IconType } from 'react-icons'
import { t } from 'i18next'
 
//MAIN SECTIONS
const TicketsTable = lazy(() => import('./Sections/Tickets/TicketsTable'))
const ClientsTable = lazy(() => import('./Sections/Clients/ClientsTable'))
const FlowsTable = lazy(() => import('./Sections/Flows/FlowsTable'))
const ContactBusinessesTable = lazy(() => import('./Sections/Businesses/BusinessesTable'))
const Ticket = lazy(() => import('./Sections/Tickets/Ticket'))
const Client = lazy(() => import('./Sections/Clients/Client'))
const Business = lazy(() => import('./Sections/Businesses/Business'))
const Flow = lazy(() => import('./Sections/Flows/Flow'))
const Stats = lazy(() => import('./Sections/Stats/Stats'))
const Settings = lazy(() => import('./Sections/Settings/Settings'))
 

 
//TYPING
type SectionKey = 'tickets' | 'clients' | 'contact-businesses' | 'stats' | 'flows' | 'settings'
interface NavBarItemProps {
    icon: ElementType
    section: SectionKey
  }
interface Section {
    description: string
    code: number
    local_id?:number
    type: string
}

//MOTION BOX
const MotionBox = motion(Box)

//MAX WAIT TIME FOR PUSHING A HEADER SECTION
const MAX_WAIT_TIME = 3000

//MAIN FUNCTION
function Content ({userInfo}:{userInfo:userInfo}) {
 
    //SOCKET
    const socket = useRef<any>(null)

    //TRANSLATION
    const { i18n } = useTranslation()
    const { t } = useTranslation('main')

    //IMPORTANT REACT CONSTANTS
    const auth = useAuth()
    const session = useSession()
    const navigate = useNavigate()
    const location = useLocation().pathname

    //EDIT GLOBAL USER INFO (ONLY GONNA CHANGE WHEN ORGANIZATIONS CHANGE)
    const [userInfoApp, setUserInfoApp] = useState<userInfo>(userInfo)
    const isAdmin = userInfoApp.organizations.find(org => org.id === auth.authData?.organizationId)?.is_admin || false

    //REF FOR DETERMINIG IF A TICKET IS BEING PROCESSED, AND WAIT FOR THE FINISH
    const isProcessingTicket = useRef<boolean>(false)

    //VIEWS REF, FOR USING ALWAYS THE LAST VIEWS VERSION
    const authDataRef = useRef(auth.authData.views as Views)

    //UPDATE VIEWS WHEN A TICKET EVENT
    const updateViews = (data:{new_data:TicketData, previous_data?:TicketData, is_new:boolean}, views:Views) => {
        
        isProcessingTicket.current = true
        
        //EDIT VIEWS LOGIC
        const previousViews = DetermineTicketViews(data?.previous_data, views, auth.authData?.userId || -1)
        const newViews = DetermineTicketViews(data?.new_data, views, auth.authData?.userId || -1)

        //VIEWS TO ADD AND REMOVE
        const viewsToRemove = previousViews.filter(pv => !newViews.some(nv => nv.view_index === pv.view_index && nv.view_type === pv.view_type))
        const viewsToAdd = newViews.filter(nv => !previousViews.some(pv => pv.view_index === nv.view_index && nv.view_type === pv.view_type))
        
        //NEW AUPDATED VIEWS NUMBER
        const updates:any = {}
        viewsToRemove.forEach(view => {
            const keyToUpdate = view.view_type === 'shared' ? 'number_of_tickets_per_shared_view' : 'number_of_tickets_per_private_view'
            if (!updates[keyToUpdate]) updates[keyToUpdate] = [...(views[keyToUpdate] || [])]
            updates[keyToUpdate][view.view_index] = (updates[keyToUpdate][view.view_index] || 0) - 1
        })
        viewsToAdd.forEach(view => {
            const keyToUpdate = view.view_type === 'shared' ? 'number_of_tickets_per_shared_view' : 'number_of_tickets_per_private_view'
            if (!updates[keyToUpdate]) updates[keyToUpdate] = [...(views[keyToUpdate] || [])]
            updates[keyToUpdate][view.view_index] = (updates[keyToUpdate][view.view_index] || 0) + 1
        }) 

        //NULLIFY ALL THE INVOLVED VIEWS
        const viewsToNullify = [...previousViews, ...newViews]
        const updatedTicketsTable = session.sessionData.ticketsTable.filter(ticketTable => {
            return !viewsToNullify.some(view => ticketTable.view.view_index === view.view_index && ticketTable.view.view_type === view.view_type)
        })

        //UPLPOAD THE VIEWS NUMBER
        authDataRef.current = {...views, ...updates}
        auth.setAuthData({ views: {...views, ...updates}})
         session.dispatch({type: 'UPDATE_TICKETS_VIEWS', payload: updatedTicketsTable});
  
        isProcessingTicket.current = false
    }

    //INITIALIZE SOCKET
    useEffect(() => {
                    
        if (Notification.permission !== 'granted') Notification.requestPermission()

        const section = localStorage.getItem('currentSection')
        if (!window.location.hash.substring(1)) navigate(section !== null ? section : 'tickets')
        else navigate(window.location)

        socket.current = io('https://api.matil.es/superservice_platform', {
            path: '/v1/socket.io/',
            query: {
                access_token: auth.authData.accessToken,
                organization_id: auth.authData.organizationId
            }
        })
    
        //CONNECT TO THE WEBSOCKET
        socket.current.on('connect', () => {})

        //RECEIVE A TICKET
        socket.current.on('ticket', (data:any) => {
            session.dispatch({type: 'EDIT_HEADER_SECTION_TICKET', payload: {...data, auth}})
            if (data?.is_new) showToast({message: `Se ha creado un nuevo ticket con ID /{#${data.new_data.local_id}}/`, type:'ticket', id:data.new_data.id, linkPath:true, navigate, isDesktop:true})
            
            function waitForProcessing() {
                const startTime = Date.now()              
                const waitInterval = setInterval(() => {
                if (!isProcessingTicket.current) {
                    clearInterval(waitInterval)
                    updateViews(data, authDataRef.current)
                } else if (Date.now() - startTime > MAX_WAIT_TIME) {
                    clearInterval(waitInterval)
                    updateViews(data, authDataRef.current)
                }
                }, 100)
              }
              waitForProcessing()
        })

        //RECEIVE A NEW MESSAGE
        socket.current.on('conversation_messages', (data:any) => {
            if (data?.local_id && data?.ticket_id && (data.sender_type === 0) ) showToast({message: `Se ha enviado un mensaje al ticket /{#${data.local_id}}/`, type:'message', id:data.ticket_id, linkPath:true, navigate,  isDesktop:true})
            session.dispatch({type: 'EDIT_HEADER_SECTION_MESSAGES', payload: {data, type:'new_message'}})
        })  

        //RECEIVE A NEW SCHEDULED MESSAGE
        socket.current.on('conversation_scheduled_messages', (data:any) => {session.dispatch({type: 'EDIT_HEADER_SECTION_MESSAGES', payload: {data, type:'new_scheduled'}})})

        //SCHEDULED MESSAGE CANCELED
        socket.current.on('conversation_canceled_scheduled_messages', (data:any) => {session.dispatch({type: 'EDIT_HEADER_SECTION_MESSAGES', payload: {data, type:'canceled_scheduled'}})})

        //CLIENT UPDATE
        socket.current.on('client', (data:any) => {
            session.dispatch({type: 'EDIT_HEADER_SECTION_CLIENT', payload: data})
        })

        //BUSINESS UPDATE
        socket.current.on('contact_business', (data:any) => {
            session.dispatch({type: 'EDIT_HEADER_SECTION_BUSINESS', payload: data})
        })

        //REFRESH A CONVERSATION
        socket.current.on('refresh_conversation', (data:any) => {session.dispatch({type: 'EDIT_HEADER_SECTION_MESSAGES', payload: data})})

        //SEND PING EACHJ 120 SECONDS
        const sendPing = () => {socket.current.emit('ping', {})}
  
        const pingInterval = setInterval(sendPing, 120000)
        return () => {
            socket?.current.disconnect()
            clearInterval(pingInterval)
        }
    }, [])
  
    //HEADER SECTIONS
    const [headerSections, setHeaderSections] = useState<Section[]>([])
    const [visibleSectionsIndex, setVisibleSectionsIndex] = useState<number>(0)

    //MANAGE OVERFLOW AND RESIZING OF THE HEADER
    const containerRef = useRef<HTMLDivElement>(null)

    //SHOW MORE HEADER SECTIONS LOGIC
    const showMoreHeaderSectionsButtonRef = useRef<HTMLDivElement>(null)
    const showMoreHeaderSectionsBoxRef = useRef<HTMLDivElement>(null)
    const [showMoreHeaderSections, setShowMoreHeaderSections] = useState<boolean>(false)
    const [showMoreHeaderSectionsBox, setShowMoreHeaderSectionsBox] = useState<boolean>(false)
    useOutsideClick({ref1:showMoreHeaderSectionsButtonRef, ref2:showMoreHeaderSectionsBoxRef, onOutsideClick:setShowMoreHeaderSectionsBox})
    useLayoutEffect(() => {

        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth
        
                const maxWidth = 280
                const minWidth = 120
                let totalWidth = 0
                let sectionsToShow = 0
                let moreFlag = false
                const sectionCount = headerSections.length

                for (const section of headerSections) totalWidth += maxWidth
                let availableWidth = containerWidth - containerWidth * 0.5
        
                if (totalWidth > availableWidth) {
                    const perSectionWidth = availableWidth / sectionCount
                    const finalWidth = perSectionWidth < minWidth ? minWidth : perSectionWidth
                    if (finalWidth === minWidth && totalWidth > availableWidth) moreFlag = true
                        headerSections.forEach((section, index) => {if ((index + 1) * finalWidth <= availableWidth) sectionsToShow += 1 })

                } else sectionsToShow = headerSections.length
                setVisibleSectionsIndex(sectionsToShow)
                setShowMoreHeaderSections(moreFlag)
            }
        }

        const resizeObserver = new ResizeObserver(handleResize)
        if (containerRef.current) resizeObserver.observe(containerRef.current)
        handleResize()
        return () => {
            if (containerRef.current) resizeObserver.unobserve(containerRef.current)
        }
      }, [headerSections])
 
    useEffect(() => {

        const handleKeyDown = (event:KeyboardEvent) => {
            if (event.ctrlKey && event.altKey) {
                let currentIndex = -1;
    
                if (event.code === 'KeyW' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                  currentIndex = headerSections.findIndex(element => {
                    const sectionToSelect = element.type === 'ticket'
                      ? `tickets/ticket/${element.code}`
                      : element.type === 'client'
                      ? `clients/client/${element.code}`
                      : `contact-businesses/business/${element.code}`
                    return location.startsWith(`/${sectionToSelect}/`) || location === `/${sectionToSelect}`
                  })
                }

              switch (event.code) {           
                case 'KeyV':
                    navigate('tickets')
                    break
                case 'KeyC':
                    navigate('clients')
                    break
                case 'KeyB':
                    navigate('contact-businesses')
                    break
                case 'KeyT':
                    navigate('stats')
                    break
                case 'KeyA':
                    navigate('settings')
                    break
                case 'KeyW':    
                    if (currentIndex !== -1) deleteHeaderSection(headerSections[currentIndex],currentIndex)
                    break
    
                case 'ArrowLeft': 
                    if (currentIndex > 0) {
                        const previousSection = headerSections[currentIndex - 1]
                        const previousPath = previousSection.type === 'ticket'
                        ? `tickets/ticket/${previousSection.code}`
                        : previousSection.type === 'client'
                        ? `clients/client/${previousSection.code}`
                        : `contact-businesses/business/${previousSection.code}`
                        navigate(`/${previousPath}`)
                    }
      
                    break
                  case 'ArrowRight': 
                    if (currentIndex < headerSections.length - 1) {
                        const nextSection = headerSections[currentIndex + 1];
                        const nextPath = nextSection.type === 'ticket'
                        ? `tickets/ticket/${nextSection.code}`
                        : nextSection.type === 'client'
                        ? `clients/client/${nextSection.code}`
                        : `contact-businesses/business/${nextSection.code}`;
                        navigate(`/${nextPath}`);
                    }
                    break
        
                default:
                  break
              }
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    },[headerSections, location])


    //DRAGGING VISIBLE HEADER COMPONENTS
    const onDragEnd = (result:any) => {
      if (!result.destination) return
      const items = Array.from(headerSections)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)
      setHeaderSections(items)
    }
  
     //ADD HEADER SECTION LOGIC
    const addHeaderSection = (description:string, code:number, section:'ticket' | 'client' | 'contact-business', local_id?:number) => {
        if (!headerSections.some(value => value.code === code && value.type === section)) {
            setHeaderSections(prev => [...prev, {'description':description, 'code': code, local_id, 'type':section}])
            if (section ===  'ticket') navigate(`tickets/ticket/${code}`)
            else if (section === 'client')  navigate(`clients/client/${code}`)
            else if (section === 'contact-business')  navigate(`contact-businesses/business/${code}`)
        }
    }
   
    //DELETE HEADER SECTION LOGIC
    const deleteHeaderSection = (element: Section, indexToDelete?: number) => {
        setHeaderSections((prevHeaderSections) => {
            const index = indexToDelete !== undefined ? indexToDelete : prevHeaderSections.findIndex(e => e.code === element.code && e.type === element.type)
            const filteredHeaderSections = prevHeaderSections.filter((e, idx) => idx !== index)
            const currentLocation = location
    
            const isUserInSection = (prevHeaderSections[index].type === 'ticket' && location === `/tickets/ticket/${prevHeaderSections[index].code}`) || 
                (prevHeaderSections[index].type === 'client' && location === `/clients/client/${prevHeaderSections[index].code}`) || 
                (prevHeaderSections[index].type === 'contact-business' && location === `/contact-businesses/business/${prevHeaderSections[index].code}`)
    
            if (isUserInSection) {
                if (filteredHeaderSections.length > 0) {
                    const targetIndex = Math.max(index - 1, 0)
                    if (prevHeaderSections[targetIndex].type === 'client') navigate(`/clients/client/${filteredHeaderSections[targetIndex].code}`)
                    else if (prevHeaderSections[targetIndex].type === 'contact-business') navigate(`/contact-businesses/business/${filteredHeaderSections[targetIndex].code}`)
                    else navigate(`/tickets/ticket/${filteredHeaderSections[targetIndex].code}`)
                } else {
                    if (currentLocation.startsWith('/clients')) navigate('/clients')
                    else if (currentLocation.startsWith('/contact-businesses')) navigate('/contact-businesses')
                    else navigate('/tickets')
                }
            }
    
            session.dispatch({type: 'UPDATE_HEADER_SECTIONS', payload: {action: 'remove', index}})
            setVisibleSectionsIndex(prev => prev - 1)
            return filteredHeaderSections
        })
    }

    //SHOW INTRODUCE CODE BOX WHEN THERE IS NO ORGANIZATION
    if (!auth.authData.organizationId) {
        return (
        <OrganizationsBox userInfoApp={userInfoApp} isAdmin={false}  setUserInfoApp={setUserInfoApp} auth={auth}  session={session} setHeaderSections={setHeaderSections}/>
        )
    }
   
    const memoizedCallWidget = useMemo(() => <CallWidget />, [])

    const isHeaderSection =  location.startsWith('/ticket') || location.startsWith('/client') || location.startsWith('/contact-businesses') || location === '/flows'
    
    //FRONT 
    return(<> 
        {socket.current ? 

        <Flex width={'100vw'} height={'100vh'} overflow={'hidden'}> 

            {memoizedCallWidget}
        
            {/*SIDEBAR*/}
            <Flex flexDir='column'  alignItems='center' justifyContent='space-between' height={'100vh'} width='60px' py='3vh' bg='gray.50' borderRightColor={'gray.300'} borderRightWidth={'1px'}>
                <Flex alignItems='center' flexDir='column'>
                    <Box onClick={() => i18n.changeLanguage('en')}>
                        <Image src='/images/Isotipo.svg' height={'22px'} width={'22px'} alt='logo'/>
                    </Box>
                    <Box mt='4vh' width='100%'> 
                        <NavBarItem icon={IoFileTrayFull} section={'tickets'}/>
                        <NavBarItem icon={BsFillPersonLinesFill} section={'clients'}/>
                        <NavBarItem icon={PiBuildingApartmentFill} section={'contact-businesses'}/>
                        {isAdmin && <NavBarItem icon={TiFlowMerge} section={'flows'}/>}
                        {isAdmin && <NavBarItem icon={BsBarChartFill} section={'stats'}/>}
                    </Box>
                </Flex>
                <Flex  alignItems='center' flexDir='column' position={'relative'}>
                    {isAdmin && <NavBarItem icon={IoIosSettings} section={'settings'}/>}
                    <Flex bg='gray.300' height='1px' width='100%' mb='2vh' mt='2vh'/>
                    <LogoutBox userInfoApp={userInfoApp} auth={auth} />
                </Flex>
            </Flex>

            {/*CONTENT OF THE SECTIONS*/}
            <Box width={'calc(100vw - 60px)'} height={'calc(100vh + 60px)'}>
 
                {/*HEADER ELEMENTS*/}
                <motion.div
                    initial={{ y: !isHeaderSection ? -60 : 0 }}
                    animate={{ y: !isHeaderSection ? -60 : 0 }}
                    exit={{ y: !isHeaderSection ? -60 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{  height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}
                >
                    <Flex height='100%' minW={0} flex='1' overflow={'scroll'} ref={containerRef} > 
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="sections" direction="horizontal">
                                {(provided) => (
                                <Flex width='100%' ref={provided.innerRef} {...provided.droppableProps} height="100%">
                                    {headerSections.length === 0?
                                        <Flex height="100%" justifyContent={'space-between'} alignItems='center' minW='120px' maxW='280px' bg={'gray.50'}  borderColor='gray.200' borderBottomWidth={'1px'}  px='15px'cursor='pointer' >
                                            <Text fontSize={'.8em'} fontWeight={'medium'}>{t('NoSections')}</Text>
                                        </Flex>
                                        :
                                    <>
                                        {headerSections.slice(0, visibleSectionsIndex).map((element, index) => {
                                            const sectionToSelect = element.type === 'ticket' ? 'tickets/ticket/' + element.code :  element.type === 'client' ? 'clients/client/' + element.code:'contact-businesses/business/' + element.code
                                            const isSectionSelected = location.startsWith(`/${sectionToSelect}/`) || location === `/${sectionToSelect}`;
                                            const width = `calc(${(containerRef.current?.getBoundingClientRect().width || 0) / visibleSectionsIndex}% - 10px)`;
                                            return (
                                                <Draggable  key={`section-${element.type}-${element.code}`} draggableId={`${element.type}-${element.code}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <Flex boxShadow={snapshot.isDragging?'0 4px 8px rgba(0, 0, 0, 0.3)':'none'}  height="100%" ref={provided.innerRef}  {...provided.draggableProps} {...provided.dragHandleProps} justifyContent={'space-between'} alignItems='center' w={width} minW='120px' maxW='280px' bg={isSectionSelected ? 'gray.100' : 'gray.50'} _hover={{ bg: isSectionSelected ? 'gray.100' : 'brand.hover_gray' }} borderColor='gray.200' borderBottomWidth={isSectionSelected?'0':'1px'} borderRightWidth='1px' px='15px'cursor='pointer' onClick={() => {navigate(sectionToSelect)}}>
                                                        <Flex flex='1' minW='0' gap='10px' alignItems={'center'}>
                                                            <Icon as={element.type === 'ticket' ? IoChatboxOutline : element.type === 'client' ? IoPersonOutline:BsBuildings } />
                                                            <Box flex='1' minW='0'>
                                                                <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} fontSize='xs' >{element.description}</Text>
                                                                <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} fontSize='2xs'>#{element.local_id?element.local_id:element.code}</Text>
                                                            </Box>
                                                        </Flex>
                                                        <Flex width={'20px'} justifyContent='center' alignItems='center' p='2px' borderRadius='.4rem' color={'gray.500'} _hover={{ bg: 'gray.200', color: 'black' }} cursor='pointer' onClick={(e) => {e.stopPropagation();deleteHeaderSection(element, index) }}>
                                                            <Icon as={RxCross2} boxSize='15px' />
                                                        </Flex>
                                                    </Flex>
                                                )}
                                                </Draggable>
                                            )
                                        })}
                                            {showMoreHeaderSections && (
                                                <Box height='100%'  px='10px' borderColor='gray.200' borderBottomWidth='1px'>
                                                    <Flex height='100%' alignItems='center' >
                                                        <Flex ref={showMoreHeaderSectionsButtonRef} justifyContent='center' onClick={() => setShowMoreHeaderSectionsBox(!showMoreHeaderSectionsBox)} alignItems='center' gap='5px' p='4px' fontSize='sm' borderRadius='.4rem' _hover={{ bg: 'gray.200' }} cursor='pointer'>
                                                            <Text fontSize={'sm'}>{t('More')}</Text>
                                                            <Icon as={IoIosArrowDown} className={showMoreHeaderSectionsBox ? "rotate-icon-up" : "rotate-icon-down"}/>
                                                        </Flex>
                                                    </Flex>
                                                    {showMoreHeaderSectionsBox &&
                                                        <MotionBox transition={{ duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0] }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}  mt='3px' maxH='80vh' overflowY='scroll'  ref={showMoreHeaderSectionsBoxRef}  position='absolute'  bg='white' zIndex={1000} boxShadow={'0 0 10px 1px rgba(0, 0, 0, 0.15)'}  borderColor={'gray.300'} borderWidth={'1px'} borderRadius={'.5rem'}> 
                                                        {headerSections.slice(visibleSectionsIndex).map((element, index) => {
                                                            const sectionToSelect = element.type === 'ticket' ? 'tickets/ticket/' + element.code :  element.type === 'client' ? 'clients/client/' + element.code:'contact-businesses/business/' + element.code
                                                            const isSectionSelected = location.startsWith(`/${sectionToSelect}/`) || location ===  `/${sectionToSelect}`
                                                                            
                                                            return(
                                                                <Flex height='100%' key={`visible-header-${index}`}  justifyContent={'space-between'} alignItems='center' width={'200px'} bg={isSectionSelected?'gray.100':'transparent'} p='15px' cursor='pointer' _hover={{bg:isSectionSelected?'gray.100':'brand.hover_gray'}}  onClick={()=>{navigate(sectionToSelect)}}> 
                                                                    <Flex flex='1'minW='0'  gap='10px' alignItems={'center'} >
                                                                    <Icon as={element.type === 'ticket' ? IoChatboxOutline : element.type === 'client' ? IoPersonOutline:BsBuildings } />
                                                                        <Box  flex='1' minW='0'   > 
                                                                            <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}  fontSize='xs' fontWeight={'medium'}>{element.description}</Text>
                                                                            <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} fontSize='2xs'>#{element.local_id?element.local_id:element.code}</Text>
                                                                        </Box>
                                                                    </Flex>
                                                                    <Flex width={'20px'} justifyContent='center' alignItems='center' p='2px' borderRadius='.4rem' color={'gray.500'} _hover={{bg:'gray.200', color:'black'}} cursor='pointer' onClick={(e) => {e.stopPropagation();deleteHeaderSection(element, visibleSectionsIndex + index)}}>
                                                                        <Icon as={RxCross2} boxSize='15px'/>
                                                                    </Flex>
                                                                </Flex>
                                                            )
                                                        })}
                                                        </MotionBox>
                                                    }
                                                </Box>
                                        )}
                                            {provided.placeholder}
                                    </>}
                                    <Box height='100%' flex='1' px='10px' borderColor='gray.200' borderBottomWidth='1px'/> 
                                </Flex>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Flex>
                    <OrganizationsBox userInfoApp={userInfoApp} isAdmin={isAdmin}  setUserInfoApp={setUserInfoApp} auth={auth} session={session} setHeaderSections={setHeaderSections}/>
                </motion.div>
            
                {/*SECTIONS*/}
                <motion.div
                    initial={{ y: !isHeaderSection ? -60 : 0 }}
                    animate={{ y: !isHeaderSection ? -60 : 0 }}
                    exit={{ y: !isHeaderSection ? -60 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flex: '1'}}
                >
                    <Suspense fallback={<></>}>    
                        <Routes >
                            <Route path="/tickets" element={<TicketsTable socket={socket}/>}/>
                            <Route path="/tickets/ticket/:n/*" element={<Ticket socket={socket} addHeaderSection={addHeaderSection} deleteHeaderSection={deleteHeaderSection} />} />
                            <Route path="/clients" element={<ClientsTable addHeaderSection={addHeaderSection}/>}  />
                            <Route path="/clients/client/:n" element={<Client socket={socket} comesFromTicket={false}  addHeaderSection={addHeaderSection} deleteHeaderSection={deleteHeaderSection}/>}/>
                            <Route path="/contact-businesses" element={<ContactBusinessesTable  addHeaderSection={addHeaderSection}/>}/>
                            <Route path="/contact-businesses/business/:n" element={<Business socket={socket} comesFromTicket={false} addHeaderSection={addHeaderSection}/>}/>
                            <Route path="/flows" element={<FlowsTable/>}  />
                            <Route path="/flows/flow/:n" element={<Flow/>}/>
                            <Route path="/stats/*" element={<Stats/>}/>
                            <Route path="/settings/*" element={<Settings />}/>
                            <Route path="*" element={<></>} />
                        </Routes>
                    </Suspense>
                </motion.div>
            </Box>
 
        </Flex>:
        <Flex height={'100vh'}  width={'100vw'} justifyContent={'center'} alignItems={'center'}> 
              <LoadingIcon/>
          </Flex>}
    </>)
}

export default Content

//SIDE BAR ITEM DEFINITION
const NavBarItem = ({ icon, section }:NavBarItemProps) => {

    //NAVIGATE CONSTANT
    const navigate = useNavigate()
    const location = useLocation().pathname
    const sectionsMap = {tickets: 'Tickets', clients: t('Clients'), stats: t('Stats'), flows:t('Flows'), 'contact-businesses':t('Businesses'), settings: t('Settings')}
    
    //HOVER AND SELECT LOGIC
    const [isHovered, setIsHovered] = useState(false)
    const handleClick = () => {
        if (section === 'tickets' || section === 'clients' || location.split('/')[1] !== section) {
            navigate(section)
         }
    }
    const isSelected = section === 'settings' ? location.split('/')[1] === 'settings' : section === 'stats' ? location.split('/')[1] === 'stats' : location === `/${section}`
  
    //FRONT
    return (
      <Tooltip isOpen={isHovered} label={sectionsMap[section]} placement='right' bg='black' ml='7px' borderRadius='.4rem' fontSize='sm' fontWeight={'medium'} p='6px'>
        <Flex justifyContent='center' alignItems='center' mt='10px' py='10px' px='10px' cursor='pointer' borderRadius='.4rem' bg={isSelected ? (isHovered ? 'blue.200' : 'blue.100') : (isHovered ? 'blue.100' : 'transparent')} color={(isHovered || isSelected) ? 'blue.300' : 'gray.400'} onClick={handleClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <Icon as={icon} boxSize='21px'/>
        </Flex>
      </Tooltip>
    )
}
  
//LOGOUT BOX 
const LogoutBox = ({ userInfoApp, auth }:{userInfoApp:userInfo, auth:any}) => {

    //SHOW AND HIDE LOGOUT ON HOVER LOGIC
    const [showLogout, setShowLogout] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setShowLogout(true)
    }
    const handleMouseLeave = () => {timeoutRef.current = setTimeout(() => {setShowLogout(false);setShowStatusList(false)}, 100)}

    //CHANGE USER STATUS
    const phoneMap:{[key:string]:[string, IconType, string]} = {'connected':[t('Connected'), BsFillTelephoneInboundFill, 'green.400'], 'out':[t('Out'), BsFillTelephoneMinusFill, 'orange.400'], 'disconnected':[t('Disconnected'), BsFillTelephoneXFill, 'gray.400']}
    const [userStatus, setUserStatus] = useState<string>('connected')
    const [showStatusList, setShowStatusList] = useState<boolean>(false)
     
    //VIEW SHORTCUTS
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false)

    //VIEW FEEDBACK
    const [showFeedback, setShowFeedback] = useState<boolean>(false)
    //FRONT
    return (<> 

        {showShortcuts && 
        <ConfirmBox maxW={'80vw'} setShowBox={setShowShortcuts}>
            <ShortCutsList setShowShowShortcuts={setShowShortcuts}/>
        </ConfirmBox>}

        {showFeedback && 
        <ConfirmBox maxW={'80vw'} setShowBox={setShowFeedback}>
            <SendFeedBack setShowFeedback={setShowFeedback}/>
        </ConfirmBox>}

        <Flex  alignItems='center' flexDir='column' position='relative' onMouseEnter={handleMouseEnter}  onMouseLeave={handleMouseLeave} >
           
            <Box position={'relative'}> 
                <Avatar name={userInfoApp.name} height={'25px'} width={'25px'} size='xs' />
                <Box bg={phoneMap[userStatus][2]} position={'absolute'} bottom={'-4px'} right={'-2px'} height={'10px'} width={'10px'} borderRadius={'full'}/>
            </Box>

            <AnimatePresence> 
            {showLogout && (
                <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}    exit={{ opacity: 0, scale: 0.95 }}  transition={{ duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.1 }, scale: {duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                style={{ transformOrigin: 'bottom left' }}  minW='190px'  position='absolute' bg='white' p='15px' left='8px' bottom='30px' zIndex={1000} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' borderColor='gray.300' borderWidth='1px' borderRadius='.5rem'>
                    <Box>
                        <Text fontSize='.8em' fontWeight='medium' whiteSpace='nowrap'>{userInfoApp.name + ' ' + userInfoApp.surname}</Text>
                        <Text fontSize='.7em' color='gray.600' whiteSpace='nowrap'>{auth.authData.email}</Text>
                    </Box>

                    <Box position='relative' mt='7px'> 

                        {showStatusList &&
                            <MotionBox initial={{ opacity: 0, top: -10}} animate={{ opacity: 1, top: 0 }}  exit={{ opacity: 0, top: -10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}} 
                            overflow={'hidden'} ml={'calc(100% + 5px)'} width={'100%'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={1000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                            {['connected', 'out', 'disconnected'].map((status, index) => (
                                <Flex key={`status-list-${index}`} bg={status === userStatus?'blue.50':''} color={phoneMap[status][2]} p='7px' gap='10px' alignItems='center' cursor='pointer' _hover={{ bg: status === userStatus?'blue.100':'brand.hover_gray' }} onClick={() => {setUserStatus(status);setShowStatusList(!showStatusList)}}>
                                    <Icon height={'12px'} width={'12px'} as={phoneMap[status][1]} />
                                    <Text fontWeight={'medium'} fontSize='.8em' whiteSpace='nowrap'>{phoneMap[status][0]}</Text>
                                </Flex>
                            ))}
                            </MotionBox>}
                        
                            <Flex borderColor={'gray.200'} borderWidth={'1px'}  color={phoneMap[userStatus][2]}  justifyContent={'space-between'}  px='7px' py='5px'  alignItems='center' cursor='pointer' _hover={{ bg: 'brand.hover_gray' }} borderRadius='.4rem' onClick={() => setShowStatusList(!showStatusList)}>
                                <Flex  alignItems={'center'} gap='10px'> 
                                    <Icon height={'12px'} width={'12px'} as={phoneMap[userStatus][1]} />
                                    <Text fontWeight={'medium'} fontSize='.8em' whiteSpace='nowrap'>{phoneMap[userStatus][0]}</Text>
                                </Flex>
                                <Box color='gray.600' > 
                                <IoIosArrowDown className={showStatusList ? "rotate-icon-up" : "rotate-icon-down"}/>
                                </Box>
                            </Flex>
                    </Box>

                    <Box bg='gray.200' height='1px' width='100%' mb='7px' mt='10px' />

                    <Flex p='7px' gap='10px'  justifyContent={'space-between'} alignItems='center' color='gray.600' cursor='pointer' _hover={{ bg: 'brand.hover_gray', color:'black' }} borderRadius='.4rem' onClick={() => {setShowLogout(false);setShowShortcuts(true)}}>
                         <Text fontSize='.9em' whiteSpace='nowrap'>{t('Shortcuts')}</Text>
                         <Icon as={PiKeyReturn} />
                    </Flex>

                    <Flex p='7px' gap='10px'  justifyContent={'space-between'} alignItems='center' color='gray.600' cursor='pointer' _hover={{ bg: 'brand.hover_gray', color:'black' }} borderRadius='.4rem' onClick={() => {setShowLogout(false);setShowFeedback(true)}}>
                         <Text fontSize='.9em' whiteSpace='nowrap'>{t('Feedback')}</Text>
                         <Icon as={VscFeedback} />
                    </Flex>
                           
                    <Box bg='gray.200' height='1px' width='100%' mb='7px' mt='10px' />

                    <Flex p='7px' gap='10px'  justifyContent={'space-between'} alignItems='center' color='red.500' cursor='pointer' _hover={{ bg: 'red.50', color:'red.600' }} borderRadius='.4rem' onClick={() => auth.signOut()}>
                         <Text fontSize='.9em' whiteSpace='nowrap'>{t('SignOut')}</Text>
                         <Icon boxSize={'13px'} as={FaArrowRightToBracket} />
                    </Flex>
                </MotionBox>
                )}
            </AnimatePresence>
        </Flex>
        </>)
}
interface OrganizationsBoxProps {
    userInfoApp:userInfo
    isAdmin:boolean
    setUserInfoApp:Dispatch<SetStateAction<userInfo>>
    auth:any
    session:any
    setHeaderSections:Dispatch<SetStateAction<Section[]>>
}
//CHANGE AND ACCESS TO AN ORGANIZATION BOX. IT RENDERS THE JOIN ORGANIZATION FULL SCREEN, WHERE THERE IS NOT ORGANIZATION
const OrganizationsBox = ({ userInfoApp, isAdmin, setUserInfoApp, auth, session, setHeaderSections }:OrganizationsBoxProps) => {    

    //JOIN ORGANIZATION WHEN THERE IS MORE ORGANIZATIONS
    const JoinOrganizationBox = () => {
        const [invitationCode, setInvitationCode] = useState<string>('')
        return(<> 
            <Box p='15px'> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>{t('InvitationCode')}</Text>
                <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
                <Text mt='2vh' mb='.5vh' fontSize='.9em' fontWeight='medium' whiteSpace='nowrap'>{t('GetInvitationCode')}</Text>
                <EditText value={invitationCode} setValue={setInvitationCode} hideInput={false} size='sm' placeholder='xxxx-xxxx-xxxx-xxxx' />
            </Box>
            <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                <Button  size='sm' bg='brand.gradient_blue' color='white'_hover={{bg:'brand.gradient_blue_hover'}} isDisabled={invitationCode === ''} onClick={() => addOrganization({invitationCode, setInvitationCode})}>{waitingNewOrganization?<LoadingIconButton/>:t('Join')}</Button>
                <Button  size='sm' onClick={()=>setShowAddOrganization(false)}>{t('Cancel')}</Button>
            </Flex>
        </>)
    }
    //NAVIGATE CONSTANT
    const navigate = useNavigate()

    //SHOW AND HIDE ORGANIZATIONS BOX ON HOVER LOGIC
    const [showOrganizations, setShowOrganizations] = useState<boolean>(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setShowOrganizations(true)
    }
    const handleMouseLeave = () => {timeoutRef.current = setTimeout(() => {setShowOrganizations(false)}, 100)}

    //SHOW JOIN ORGANIZTION BOX
    const [showAddOrganization, setShowAddOrganization] = useState<boolean>(false)

    //BOOLEAN FOR SHOW THE LOADING ICON IN THE BUTTON
    const [waitingNewOrganization, setWaitingOrganization] = useState<boolean>(false)

    //INVITATION CODE, WHEN THERE IS NO ORGANIZATION
    const [firstInvitationCode, setFirstInvitationCode] = useState<string>('')

    //JOIN TO AN ORGANIZATION FUNCTION
    const addOrganization = async ({invitationCode, setInvitationCode}:{invitationCode:string, setInvitationCode:Dispatch<SetStateAction<string>>}) => {
        setInvitationCode('')
        setShowOrganizations(false)
        setWaitingOrganization(true)
        navigate('/tickets')

        const response = await fetchData({endpoint:`user/join_superservice_organization/${invitationCode}`, method:'put', auth:auth})

        if (response?.status === 200){
            const response2 = await fetchData({endpoint:`user`, setValue:setUserInfoApp, auth:auth})
            if (response2?.status === 200){
                const response3 = await fetchData({endpoint:`superservice/${response2.data.organizations[response2.data.organizations.length - 1].id}/user`,  auth:auth})
                    
                    if (response3?.status === 200){
                        auth.setAuthData({views:response3.data, organizationId:response2.data.organizations[response2.data.organizations.length - 1].id})
                        setWaitingOrganization(false)
                    }
                    else {setWaitingOrganization(false);showToast({message:t('Join_Failed'), type:'failed'})}
            }
            else {setWaitingOrganization(false);showToast({message:t('Join_Failed'), type:'failed'})}
        }
        else {setWaitingOrganization(false);showToast({message:t('Join_Failed'), type:'failed'})}
    }

    //CHANGE ORGANIZATION LOGIC
    const changeOrganization = async (org:Organization) => {
        localStorage.removeItem('currentView')
        localStorage.removeItem('currentSection')
        localStorage.setItem('currentOrganization', String(org.id))
        session.dispatch({type:'DELETE_ALL_SESSION'})
        setHeaderSections([])
        const responseOrg = await fetchData({endpoint:`superservice/${org.id}/user`, auth})
        auth.setAuthData({views: responseOrg?.data, organizationId:org.id, organizationName:org.name})
        navigate('/tickets')
     }

    //FRONT
    return (
        <> 
        {showAddOrganization &&     
        <ConfirmBox setShowBox={setShowAddOrganization}> 
            <JoinOrganizationBox/>
        </ConfirmBox>}

      {auth.authData.organizationId ?
      <Flex height='100%'gap='1vw'  width={'250px'} justifyContent='end' alignItems='center' borderColor='gray.200' borderBottomWidth='1px' > 
        <Flex paddingLeft='20px'  onMouseEnter={handleMouseEnter}  onMouseLeave={handleMouseLeave} height={'100%'} alignItems={'center'}> 
            <Text cursor={'pointer'} onClick={() => setShowOrganizations(!showAddOrganization)} _hover={{color:'gray.600'}} whiteSpace={'nowrap'}  mr='2vw' fontWeight='medium'>
                {auth.authData.organizationName}
            </Text>
            <AnimatePresence>     
            {showOrganizations && (
                <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}    exit={{ opacity: 0, scale: 0.9 }}  transition={{ duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.1 }, scale: {duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                style={{ transformOrigin: 'top' }} position='absolute' bg='white' p='15px' right='2vw' top='50px' zIndex={1000} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' borderColor='gray.300' borderWidth='1px' borderRadius='.5rem' >
                    <Box>
                    <Text fontSize='.9em' fontWeight='medium' whiteSpace='nowrap' mb='1vh'>{t('Organizations')}</Text>
                    {userInfoApp.organizations.length === 0 ? (
                        <Text fontSize='.8em' fontWeight='normal'>{t('NoOrganizations')}</Text>
                    ) : (
                        userInfoApp.organizations.map((org) => (
                        <Flex key={`organization-${org.id}`} cursor={'pointer'} bg={auth.authData.organizationId === org.id ? 'blue.50':'transparent'} alignItems='center' p='7px' fontSize='.8em' _hover={{ bg:auth.authData.organizationId === org.id ?'blue.50': 'brand.hover_gray' }} borderRadius='.7rem' onClick={() => changeOrganization(org)}>
                            {org.name}
                        </Flex>
                        ))
                    )}
                    </Box>
                    <Box bg='gray.300' height='1px' width='100%' mb='1vh' mt='2vh' />

                    <Flex justifyContent={'space-between'}gap='10px' alignItems={'center'} p='7px'  fontSize='.9em' borderRadius={'.5rem'} _hover={{bg:'brand.hover_gray', color:'black'}} color='gray.600' cursor='pointer' onClick={() => {setShowOrganizations(false);setShowAddOrganization(true)}}>
                        <Text>{t('AddOrganization')}</Text>
                        <Icon as={FiPlus}/>
                    </Flex>
                    {isAdmin && <Flex justifyContent={'space-between'}gap='10px' alignItems={'center'} p='7px'  fontSize='.9em' borderRadius={'.5rem'} _hover={{bg:'brand.hover_gray', color:'black'}} color='gray.600' cursor='pointer' onClick={() => {setShowOrganizations(false);navigate('/settings/organization/data')}}>
                        <Text>{t('SeeOrganization')}</Text>
                        <Icon as={BiSolidBuildings}/>
                    </Flex>}
                </MotionBox>
            )}
            </AnimatePresence>
        </Flex>
      </Flex>: 
      
        <Flex width='100vw' bg='gray.100' height='100vh' alignItems={'center'} justifyContent={'center'}>
            <Box maxW={'650px'} rounded={'lg'} bg='white' boxShadow={'lg'} p={8} >
                <Text fontWeight='medium' fontSize={'1.2em'}>{t('NoOrganizationUser')}</Text>
                <Text fontWeight='medium' fontSize={'1em'} mt='2vh' mb='.5vh'>{t('GetInvitationCode')}</Text>
                <EditText value={firstInvitationCode} setValue={setFirstInvitationCode} placeholder='xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx' hideInput={false}/>
                <Button color='white' bg={'brand.gradient_blue'} _hover={{bg:'brand.gradient_blue_hover'}} size='sm' leftIcon={waitingNewOrganization?<></>:<FaPlus />} mt='2vh' isDisabled={firstInvitationCode === ''} width='100%' onClick={() => addOrganization({invitationCode:firstInvitationCode, setInvitationCode:setFirstInvitationCode})}>{waitingNewOrganization?<LoadingIconButton/>:t('Join')}</Button>
            </Box>
            <Button onClick={() => auth.signOut()} position='fixed' bottom='2vh' left='2vh' size='sm'bg='brand.gradient_blue' color='white' leftIcon={<TbArrowBack/>} _hover={{bg:'brand.gradient_blue_hover'}}>{t('Return')}</Button>
        </Flex>}
        </>
    )
}
  
