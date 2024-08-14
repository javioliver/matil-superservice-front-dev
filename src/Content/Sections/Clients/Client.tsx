/*
    MAIN CLIENT FUNCTION (clients/client/{client_id} or tickets/ticket/{ticket_id}/client)
*/

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, Dispatch, SetStateAction, Fragment, lazy, Suspense, useMemo } from "react"
import { useAuth } from "../../../AuthContext"
import { useSession } from "../../../SessionContext"
import { useLocation, useNavigate } from "react-router-dom"
import DOMPurify from 'dompurify'
import { useTranslation } from 'react-i18next'
//FRONT
import { Flex, Box, Text, Icon, Textarea, Avatar, Button, Skeleton, IconButton} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//FETCH DATA
import fetchData from "../../API/fetchData"
//COMPONENTS
import LoadingIconButton from "../../Components/LoadingIconButton"
import CustomSelect from "../../Components/CustomSelect"
import Table from "../Tickets/Table"
import EditText from "../../Components/EditText"
import ConfirmmBox from "../../Components/ConfirmBox"
import CreateBusiness from "../Businesses/CreateBusiness"
//FUNCTIONS
import useOutsideClick from "../../Functions/clickOutside"
import timeAgo from "../../Functions/timeAgo"
//ICONS
import { FaPlus, FaArrowRight, FaBuilding } from "react-icons/fa6"

import { RxCross2 } from "react-icons/rx"
import { BsPersonFill } from "react-icons/bs"
import { TbArrowMerge, TbKey } from 'react-icons/tb'
import { MdBlock } from "react-icons/md"
import { IoIosArrowForward, IoIosArrowBack, IoIosArrowDown } from "react-icons/io"
//TYPING
import { ClientData, Tickets, contactDicRegex, ContactChannel, logosMap, HeaderSectionType, DeleteHeaderSectionType, languagesFlags, ContactBusinessesTable, TicketColumn, Clients } from "../../Constants/typing"
import showToast from "../../Components/ToastNotification"
 
//COMPONENTS    
const Business = lazy(() => import('../Businesses/Business'))

//TYPING
interface ClientProps {
    comesFromTicket:boolean
    addHeaderSection:HeaderSectionType
    deleteHeaderSection: DeleteHeaderSectionType
    clientData?:ClientData | null
    setClientData?:Dispatch<SetStateAction<ClientData | null>>
    clientTickets?:Tickets | null
    setClientTickets?:Dispatch<SetStateAction<Tickets | null>>
    businessData?:ContactBusinessesTable | null
    setBusinessData?:Dispatch<SetStateAction<ContactBusinessesTable | null>>
    businessClients?:Clients | null
    setBusinessClients?:Dispatch<SetStateAction<Clients | null>>
    socket:any
}

//MOTION BOX
const MotionBox = motion(Box)
 
//MAIN FUNCTION
function Client ({comesFromTicket,  socket, addHeaderSection, deleteHeaderSection, clientData, setClientData, clientTickets, setClientTickets, businessData, setBusinessData, businessClients, setBusinessClients}: ClientProps) {
    

    //TRANSLATION
    const { t } = useTranslation('flows')

    //CONSTANTS
    const auth = useAuth()
    const session = useSession()
    const location = useLocation().pathname
    const navigate = useNavigate()
    let languagesMap:any = {}
    for (const key in languagesFlags) {
        if (languagesFlags.hasOwnProperty(key)) {
            const values = languagesFlags[key]
            languagesMap[key] = values[0]
        }
    }

    //WEBSOCKET ACTIONS, THEY TRIGEGR ONLY IF THE USER IS INSIDE THE SECTION
    useEffect(() =>  {
        socket?.current.on('client', (data:any) => {

            if (data.data.id === clientDataEditRef.current?.id) {
                if (setClientData) setClientData(data.data)
                else setClientDataEdit(data.data)
            }
        })

        socket?.current.on('ticket', (data:any) => {
            if (data.client_id === clientDataEditRef.current?.id && !setClientTickets) {
                setClientTicketsEdit(prev => {
                    if (!prev) return prev
                    const elementToAdd = {created_at:data.new_data.created_at, id:data.new_data.id, local_id:data.new_data.local_id, status:data.new_data.status, title:data.new_data.title, updated_at:data.new_data.updated_at }
                    let updatedPageData
                    if (data.is_new) updatedPageData = [elementToAdd, ...prev.page_data]
                    else updatedPageData = prev.page_data.map(ticket =>ticket.id === data.new_data.id ? elementToAdd : ticket)
                    return {
                      ...prev,
                      total_tickets: data.is_new ? prev.total_tickets + 1 : prev.total_tickets,
                      page_data: updatedPageData,
                    }
                  })
            }
        })
        
        },[])

    //SCROLL REFS
    const scrollRef1 = useRef<HTMLDivElement>(null)

    //MERGE LOGIC
    const [showMerge, setShowMerge] = useState<boolean>(false)
    
    //BLOCK LOGIC 
    const [showBlock, setShowBlock] = useState<boolean>(false)

    //SHOW ADD BUSINESS BOOLEAN
    const [showAddBusiness, setShowAddBusiness] = useState<boolean>(false)

    //CLIENT DATA
    const [clientDataEdit, setClientDataEdit] = useState<ClientData | null>(comesFromTicket ? clientData ?? null : null)
    const clientDataEditRef = useRef<ClientData | null>(comesFromTicket ? clientData ?? null : null)
    useEffect(() => {
        if (clientData) {
            clientDataEditRef.current = clientData
            setClientDataEdit(clientData)
        }
    }, [clientData])

    //TICKET DATA
    const [clientTicketsEdit, setClientTicketsEdit] = useState<Tickets | null>(comesFromTicket ? clientTickets ?? null : null)
    useEffect(() => {
        if (clientTickets) setClientTicketsEdit(clientTickets)
    }, [clientTickets])
    const [ticketsFilters, setTicketsFilters ] = useState<{page_index:number, sort_by?:TicketColumn | 'not_selected', search?:string, order?:'asc' | 'desc'}>({page_index:1}) 
   
    //BUSINESS DATA
    const [businessDataEdit, setBusinessDataEdit] = useState<ContactBusinessesTable | null>(comesFromTicket ? businessData ?? null : null)
   
    //BUSINESS CLIENTS
    const [businessClientsEdit, setBusinessClientsEdit] = useState<Clients | null>(comesFromTicket ? businessClients ?? null : null)

    //CHANGE SECTION AND CREATE CONTACT BUSINESS LOGIC (INLY IF COMES FROM CLIENT TABLE)
    const [clientSection, setClientSection ] = useState<'business' | 'client'>('client')
  
    //REQUEST CLIENT, CONVERSATIONS AND CLIENT INFO
    useEffect(() => { 
        const loadData = async () => {

            //ONLY CALL IF IT COMES FROM CLIENTS TABLE
            if (!comesFromTicket) {

                //FIND IF THERE IS A CLIENT IN HEADER SECTIONS
                const clientId = parseInt(location.split('/')[location.split('/').length - 1])
                const headerSectionsData = session.sessionData.headerSectionsData
                const clientElement = headerSectionsData.find(value => value.id === clientId && value.type === 'client')
                    
                //SET THE TITLE AND THE CURRETN SECTION IN LOCAL S
                document.title = `Cliente: ${clientId} - ${auth.authData.organizationName} - Matil`
                localStorage.setItem('currentSection', `clients/client/${clientId}`)
                
                //CHANGE THE INFORMATION IF ITS A HEADER SECTION
                if (clientElement?.data?.clientData) {
                    setClientDataEdit(clientElement.data.clientData)
                    clientDataEditRef.current = clientElement.data.clientData

                    if (clientElement.data.clientTickets) setClientTicketsEdit(clientElement.data.clientTickets)
                    else {
                        console.log('HOLA')
                        const reponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, params:{page_index:1, view_index:0,view_type:'', retrieve_exclusively_for_client:true, client_id:clientId}, setValue:setClientTicketsEdit, auth })         
                        session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{id:clientId, type:'client', data:{...clientElement.data ,clientTickets:reponse?.data}}}})
                    }

                     setBusinessDataEdit(clientElement.data.businessData)
                    setBusinessClientsEdit(clientElement.data.businessClients)
                }
                
                //CALL THE API AND REQUEST (CLIENT DATA, CLIENT TICKETS AND CONTACT BUSINESS)
                else {
                    const clientResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${clientId}`, setValue:setClientDataEdit,  auth})
                     
                    if (clientResponse?.status === 200) {
                        addHeaderSection(clientResponse.data.name , clientResponse.data.id, 'client')
                        clientDataEditRef.current = clientResponse.data

                        const ticketsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, params:{page_index:1, view_index:0,view_type:'', retrieve_exclusively_for_client:true, client_id:clientId}, setValue:setClientTicketsEdit, auth })         
                        
                        let businessDict:ContactBusinessesTable = {id:-1, domain: '',name:'', notes: '', labels:'', created_at:'', last_interaction_at:''}
                        if (clientResponse.data.contact_business_id && clientResponse.data.contact_business_id !== -1)  {
                            const businessResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses/${clientResponse.data.contact_business_id}`, setValue:setBusinessDataEdit, auth })
                            businessDict = businessResponse?.data
                        }
                        else setBusinessDataEdit(businessDict)
                        if (ticketsResponse?.status === 200) {
                            session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{id:clientId, type:'client', data:{clientData:clientResponse.data,  clientTickets:ticketsResponse?.data, businessData:businessDict}}}})
                        }
                    }
                    else navigate('/clients')
                }
            }
        }
        loadData()
    }, [location])


    //UPDATE CLIENT TICKETS TABLE
    const updateTable = async(applied_filters:{page_index:number, sort_by?:TicketColumn | 'not_selected', search?:string, order?:'asc' | 'desc'} | null) => {

        const filtersToSend = applied_filters?applied_filters:{page_index:1}

        const ticketsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, params:{view_index:0,view_type:'', retrieve_exclusively_for_client:true, client_id:clientDataEdit?.id, ...filtersToSend}, setValue:setClientTicketsEdit, auth })         
        if (ticketsResponse?.status == 200) {
            setClientTicketsEdit(ticketsResponse?.data)
            setTicketsFilters(filtersToSend)
            session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{clientTickets:ticketsResponse?.data}}})
        }
    }
  
    //TRIGGER UPDATE DATA ON CHANGES
    const updateData = async(newData?:ClientData | null) => {

        const compareData = newData ? newData : clientDataEdit as ClientData
        if (JSON.stringify(clientDataEditRef.current) !== JSON.stringify(compareData)){
            const updateResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${compareData?.id}`, auth:auth, requestForm:compareData, method:'put', toastMessages:{'works':`El cliente /{${clientDataEdit?.name}}/ se actualizó correctamente.`,'failed':`Hubo un problema al actualizar la información.`}})
            if (updateResponse?.status === 200) {
                clientDataEditRef.current = compareData
                if (comesFromTicket && setClientData) setClientData(compareData)
            }
        }
    }

    //ADD NEW CHANNEL LOGIC
    const addNewChannelBoxRef = useRef<HTMLDivElement>(null)
    const addNewChannelButtonRef = useRef<HTMLDivElement>(null)
    const [showAddNewChannel, setShowAddNewChannel] = useState<boolean>(false) 
    useOutsideClick({ref1:addNewChannelBoxRef, ref2:addNewChannelButtonRef, onOutsideClick:setShowAddNewChannel})
    const addNewChannel = (key:ContactChannel) => {
        setShowAddNewChannel(false)
        setClientDataEdit(prevData => prevData ? ({ ...prevData, [key]: '-' }) as ClientData : null)
    }

    //NOTES WRITTING AND RESIZING LOGIC
    const textareaNotasRef = useRef<HTMLTextAreaElement>(null)
    const adjustTextareaHeight = (textarea:any) => {
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
    }
    const handleInputNotasChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setClientDataEdit(prevData => prevData ? ({ ...prevData, notes:DOMPurify.sanitize(event.target.value)}) as ClientData : null)

    }
    useEffect(() =>{if (clientDataEdit) adjustTextareaHeight(textareaNotasRef.current)}, [clientDataEdit?.notes])

    //TAGS LOGIC
    const [inputValue, setInputValue] = useState<string>('')
    const handleKeyDown = (event:KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          const newTag = inputValue.trim()
          if (newTag) {
            let newClientData:ClientData | null = null
            if (clientDataEdit) {
                const labelsArray = clientDataEdit.labels ? clientDataEdit.labels.split(',') : []
                labelsArray.push(newTag)
                newClientData = { ...clientDataEdit, labels: labelsArray.join(',') }
            }
            updateData(newClientData)
            setClientDataEdit(newClientData)
            setInputValue('')
          }
        }
      } 
    const removeTag = (index: number) => {
        let newClientData:ClientData | null = null
        if (clientDataEdit && clientDataEdit.labels) {
            const labelsArray = clientDataEdit.labels.split(',')
            labelsArray.splice(index, 1)
            newClientData = { ...clientDataEdit, labels: labelsArray.join(',') }
          }
        setClientDataEdit(newClientData)
        updateData(newClientData)
    }
        
    //UPDATE LANGUAGE
    const updateLanguage = (element:string) => {
        const newClientData = {...clientDataEdit as ClientData, language:element}
        updateData(newClientData)
        if (clientDataEdit) setClientDataEdit(newClientData)
    }

    //CHANGE NAME
    const handelChangeName = (value:string) => {
        if (clientDataEdit) setClientDataEdit(prevData => prevData ? ({ ...prevData, name:value}) as ClientData : null)
    }

    //CHANGE CHANNEL DATA
    const handleChangeChannel = (value: string, channel: ContactChannel) => {

        if (clientDataEdit) {
            setClientDataEdit(prevData => {
                if (prevData) {
                    const currentValue = prevData[channel]
                    const newValue = currentValue === '-' && value.trim() !== '' ? value.slice(1) : value
                    if (value === '') updateData({...prevData, [channel]: ''} )    
                    return { ...prevData, [channel]: newValue } as ClientData
                }
                return null
            })
        }
     }

    //EDIT THE BUSINESS DATA, WHEN CREATE A NEW ONE
    const handleCreateContactBusiness = (new_data:ContactBusinessesTable) => {
        setBusinessDataEdit(new_data)
        updateData({...clientDataEdit as ClientData, contact_business_id:new_data.id})
        session.dispatch({type:'EDIT_CONTACT_BUSINESS',payload:{data:new_data, id:clientDataEdit?.id}})
    }
    
    //COMPONENT FOR SEARCH A CONTACT BUSONESS
    const SearchBusiness = () => {
        //REFS
        const buttonRef = useRef<HTMLDivElement>(null)
        const boxRef = useRef<HTMLDivElement>(null)
        const [showSearch, setShowSearch] = useState(false)
        
        const [text, setText] = useState<string>('')
        const [showResults, setShowResults] = useState<boolean>(false)
        const [elementsList, setElementsList] = useState<any>([])
        const [waitingResults, setWaitingResults] = useState<boolean>(false)

        //BOOLEAN TO CONTROL THE VISIBILITY OF THE LIST AND CLOSE ON OUTSIDE CLICK
        useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef:scrollRef1, onOutsideClick:setShowSearch})
    
        useEffect(() => {
            if (text === '') {setWaitingResults(false);setShowResults(false);return}
            
            else {
                setWaitingResults(true)
                const timeoutId = setTimeout(async () => {
 
                const response = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/contact_businesses`, setValue:setElementsList, auth, params: { page_index: 1, search: text }})
                if (response?.status === 200) {setShowResults(true);setWaitingResults(false)}
                else {setShowResults(false);setWaitingResults(false)}
                }, 500)
                return () => clearTimeout(timeoutId)
            }
        }, [text])
    
 
 
     return (
         <Box position={'relative'}>
            <Flex bg={'transaprent'} cursor={'pointer'} alignItems={'center'} onClick={() => setShowSearch(!showSearch)} ref={buttonRef} height={'37px'} fontSize={'.9em'}  border={showSearch ? "3px solid rgb(77, 144, 254)":"1px solid transparent"} justifyContent={'space-between'} px={showSearch?'5px':'7px'} py={showSearch ? "5px" : "7px"} borderRadius='.5rem' _hover={{border:showSearch?'3px solid rgb(77, 144, 254)':'1px solid #CBD5E0'}}>
                <Text>{businessDataEdit?.name}</Text>
                 <IoIosArrowDown className={showSearch ? "rotate-icon-up" : "rotate-icon-down"}/>
            </Flex>
            
            <AnimatePresence> 
                {showSearch && 
                <MotionBox initial={{ opacity: 5, marginTop: -5 }} animate={{ opacity: 1, marginTop: 5 }}  exit={{ opacity: 0,marginTop:-5}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                 maxH='30vh' overflow={'scroll'} width='140%' gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000} position={'absolute'} right={0} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                    <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Buscar..." style={{border:'none', outline:'none', background:'transparent', padding:'10px'}}/>
                    <Box height={'1px'} width={'100%'} bg='gray.200'/>
                   
                    {(showResults && 'page_data' in elementsList) ? <>
                        <Box maxH='30vh'>
                            {elementsList.page_data.length === 0? 
                            <Box p='15px'><Text fontSize={'.9em'} color='gray.600'>{waitingResults?<LoadingIconButton/>:'No hay ninguna coincidencia'}</Text></Box>
                            :<> {elementsList.page_data.map((business:ContactBusinessesTable, index:number) => (
                                <Flex _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'} onClick={() => {setText('');handleCreateContactBusiness(business);setShowResults(false)}} key={`user-${index}`} p='10px' gap='10px' >
                                    <Icon boxSize={'12px'} color='gray.700' as={FaBuilding}/>
                                    <Box>
                                        <Text fontSize={'.9em'}>{business.name}</Text>
                                    </Box>
                                </Flex>
                            ))}</>}
                        </Box>
                      
                    </>:<Box p='15px'><Text fontSize={'.9em'} color='gray.600'>{waitingResults?<LoadingIconButton/>:'No hay ninguna coincidencia'}</Text></Box>}
                    <Box height={'1px'} width={'100%'} bg='gray.200'/>
                        <Flex _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'} onClick={() => {setText('');setShowResults(false);setShowAddBusiness(true)}}  p='10px' gap='15px' >
                            <Icon boxSize={'12px'} color='gray.700' as={FaPlus}/>
                            <Box>
                                <Text fontSize={'.9em'}>Crear una nueva empresa</Text>
                            </Box>
                        </Flex>
                </MotionBox>} 
            </AnimatePresence>
         </Box>
     )
    }

    //COMPONENT FOR BLOCKING A CLIENT
    const BlockComponent = () => {

        const [waitingConfirmBlock, setWaitingConfirmBlock] = useState<boolean>(false)

        const blockClient = async() => {
            updateData({...clientDataEditRef.current as ClientData, is_blocked:true})
            showToast({message:'Cliente bloqueado con éxito'})
            setShowBlock(false)
        }

        return(<> 
            <Box p='15px'> 
            <Text fontWeight={'medium'} fontSize={'1.2em'}>Confirmar bloqueo</Text>
            <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
            <Text>¿Desea bloquear el cliente <span style={{fontWeight:'500'}}> #{clientDataEdit?.id} {clientDataEdit?.name}</span></Text>
        </Box>
        <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
            <Button  size='sm' bg={'red'} _hover={{bg:'red.600'}} color={'white'} onClick={blockClient}>{waitingConfirmBlock?<LoadingIconButton/>:'Bloquear'}</Button>
            <Button  size='sm' onClick={() => setShowBlock(false)}>Cancelar</Button>
        </Flex>
        </>)
    }

    const memoizedAddBusiness = useMemo(() => (
        <ConfirmmBox setShowBox={setShowAddBusiness}> 
            <CreateBusiness setShowBox={setShowAddBusiness} actionTrigger={(data:any) => handleCreateContactBusiness(data)}/>
        </ConfirmmBox>
    ), [showAddBusiness])

    const memoizedMergeBox = useMemo(() => (
        <ConfirmmBox setShowBox={setShowMerge}> 
            <MergeBox clientData={clientDataEdit} setShowMerge={setShowMerge} deleteHeaderSection={deleteHeaderSection}/>
        </ConfirmmBox>
    ), [showMerge])


    const memoizedBlockBox = useMemo(() => (
        <ConfirmmBox setShowBox={setShowBlock}> 
            <BlockComponent/>
        </ConfirmmBox>
    ), [showBlock])
 
    return(
     
    <Suspense fallback={<></>} >    

        {!comesFromTicket && 
            <Flex px='30px' height='60px' bg='gray.100' borderBottomWidth={'1px'} borderBottomColor='gray.200' flex='1' alignItems={'center'} >
                <Flex borderRadius={'.3rem'} height={'70%'}  alignItems={'center'} borderWidth={'1px 1px 1px 1px'}  borderColor='gray.300'> 
                    
                    <Flex alignItems='center' gap='6px'  onClick={() => {if (businessDataEdit?.id !== -1) setClientSection('business')}} cursor={'pointer'}  bg={clientSection === 'business' ?  'gray.300':'transparent' } height={'100%'}  borderRightWidth={'1px'} borderRightColor='gray.300'  px={{md:'10px',lg:'20px'}}> 
                        <Icon as={FaBuilding} boxSize={'14px'} />
                        <Skeleton isLoaded={businessDataEdit !== null}> <Text whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}}>{businessDataEdit?.id === -1?'Sin empresa':businessDataEdit?.name}</Text></Skeleton>
                    </Flex> 
                    <Flex alignItems='center' gap='6px' onClick={() => setClientSection('client')}  cursor={'pointer'} bg={clientSection === 'client'?'gray.300':'transparent'} height={'100%'}  borderRightWidth={'1px'} borderRightColor='gray.300'  px={{md:'10px',lg:'20px'}}> 
                        <Icon as={BsPersonFill} boxSize={'17px'} />
                        <Skeleton isLoaded={clientDataEdit !== null}> 
                            <Text whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}} >{clientDataEdit?.name === ''? 'Cliente de la Web':clientDataEdit?.name}</Text>
                        </Skeleton>
                    </Flex>
                </Flex>
        </Flex>}

        {showAddBusiness && memoizedAddBusiness}


        {clientSection === 'client'?
         <>
            <Flex height={'calc(100vh - 120px)'}  width={'100%'}>
                <Box ref={scrollRef1} p='2vw' bg='gray.50' width={'320px'} borderRightWidth={'1px'} borderRightColor='gray.200' overflow={'scroll'}  >
                    <Skeleton isLoaded={clientData !== null}> 
                        {Object.keys(clientDataEdit || {}).map((con, index) => (
                        <Fragment key={`channel-${index}`}> 
                            {(Object.keys(contactDicRegex).includes(con)) && clientDataEdit?.[con as ContactChannel] && clientDataEdit?.[con as ContactChannel] !== '' &&
                                <Flex mt='1vh' alignItems={'center'} gap='10px' key={`contact_type-2-${index}`}> 
                                    <Box width={'70px'}> 
                                        <Text fontSize='.8em' fontWeight={'medium'} color='gray' >{contactDicRegex[con as ContactChannel][0]}</Text>
                                    </Box>
                                    <Box flex='1'> 
                                        <EditText updateData={updateData} focusOnOpen={clientDataEdit?.[con as ContactChannel] === '-'} maxLength={contactDicRegex[con as ContactChannel][2]} regex={contactDicRegex[con as ContactChannel][1]} value={clientDataEdit?.[con as ContactChannel]} setValue={(value:string) => handleChangeChannel(value, con as ContactChannel)} />
                                    </Box>
                                </Flex>}
                        </Fragment>))}
                    </Skeleton>
                    <Box position={'relative'}> 
                        <Flex ref={addNewChannelButtonRef} mt='2vh'  alignItems={'center'} gap='7px' color={'blue.600'} _hover={{color:'blue.700'}} cursor={'pointer'}>
                            <Icon as={FaPlus} boxSize={'11px'} />
                            <Text fontSize={'.85em'} onClick={() => setShowAddNewChannel(!showAddNewChannel)}>añadir contacto</Text>
                        </Flex>
                        {showAddNewChannel && 
                            <MotionBox initial={{ opacity: 0, height:0}} animate={{ opacity: 1, height:'auto' }}  transition={{ duration: 0.15,  ease: [0.0, 0.9, 0.9, 1.0]}}
                             maxH={'40vh'} overflowY={'scroll'} mt='5px' position='absolute' ref={addNewChannelBoxRef} bg='white'  zIndex={1000} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' borderColor='gray.300' borderWidth='1px' borderRadius='.5rem'>         
                                {Object.keys(contactDicRegex).map((con, index) => (
                                <Fragment key={`select-channel-${index}`}> 
                                    {(clientDataEdit?.[con as ContactChannel] === null || clientDataEdit?.[con as ContactChannel] === '')&&
                                        <Flex color='gray.600' fontSize={'.9em'} onClick={() => addNewChannel(con as ContactChannel)} key={`channels-${index}`}  px='15px' py='10px' cursor={'pointer'} gap='10px' alignItems={'center'} _hover={{bg:'gray.100'}}>
                                            <Icon as={logosMap[contactDicRegex[con as ContactChannel][3]][0]}/>
                                            <Text>{t(contactDicRegex[con as ContactChannel][3])}</Text>
                                        </Flex>
                                    }
                                </Fragment>))}
                            </MotionBox>
                        }
                    </Box>
                    <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300'/>

                   
                    <Flex mt='1vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Empresa</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={clientDataEdit !== null}> 
                            <SearchBusiness/>
                        </Skeleton>
                    </Flex>

                    <Flex mt='1vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Idioma</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={clientDataEdit !== null}> 
                            <Box flex='1'> 
                                <CustomSelect labelsMap={languagesMap} containerRef={scrollRef1} selectedItem={clientDataEdit?.language}  setSelectedItem={updateLanguage} options={Object.keys(languagesMap)} hide={true} />
                            </Box>
                        </Skeleton>
                    </Flex>
                   
                    <Flex mt='3vh' gap='10px'> 
                        <Box width={'70px'} mt='11px'> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Etiquetas</Text>
                        </Box>
                        <Skeleton isLoaded={clientDataEdit !== null}> 
                            <Box flex='1'> 
                                <Box   minHeight="30px" maxH="300px" border="1px solid transparent"   p="5px" _hover={{ border: "1px solid #CBD5E0" }} _focusWithin={{ borderColor:'transparent', boxShadow:'0 0 0 2px rgb(77, 144, 254)'}} borderRadius=".5rem" overflow="auto" display="flex" flexWrap="wrap" alignItems="center" onKeyDown={handleKeyDown}  tabIndex={0}>
                                    {clientDataEdit?.labels === '' ? <></>:
                                    <> 
                                        {((clientDataEdit?.labels || '').split(',')).map((label, index) => (
                                            <Flex key={`label-${index}`} borderRadius=".4rem" p='4px' fontSize={'.75em'} alignItems={'center'} m="1"bg='gray.200' gap='5px'>
                                                <Text>{label}</Text>
                                                <Icon as={RxCross2} onClick={() => removeTag(index)} cursor={'pointer'} />
                                            </Flex>
                                        ))}
                                    </>
                                    }
                                    <Textarea  maxLength={20} p='5px'  resize={'none'} borderRadius='.5rem' rows={1} fontSize={'.9em'}  borderColor='transparent' borderWidth='0px' _hover={{borderColor:'transparent',borderWidth:'0px'}} focusBorderColor={'transparent'}  value={inputValue}  onChange={(event) => {setInputValue(event.target.value)}}/>
                                </Box>
                            </Box>
                        </Skeleton>
                    </Flex>
                    <Flex mt='1vh' gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em'  mt='10px' fontWeight={'medium'} color='gray' >Notas</Text>
                        </Box>
                        <Skeleton isLoaded={clientDataEdit !== null}> 
                            <Box flex='1'> 
                                <Textarea  maxLength={1000} onBlur={() => updateData()} minHeight={'37px'} placeholder="Notas..." maxH='300px' value={clientDataEdit?.notes} ref={textareaNotasRef} onChange={handleInputNotasChange} size='sm' p='10px'  resize={'none'} borderRadius='.5rem' rows={1} fontSize={'.9em'}  borderColor='transparent' _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'9px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                            </Box>
                        </Skeleton>
                    </Flex>
                    
                    <Flex mt='3vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Creado</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={clientDataEdit !== null}> 
                           <Text fontSize={'.9em'}>{timeAgo(clientDataEdit?.created_at)}</Text>
                        </Skeleton>
                    </Flex>

                    <Flex mt='3vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Última interacción</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={clientDataEdit !== null}> 
                           <Text fontSize={'.9em'}>{timeAgo(clientDataEdit?.last_interaction_at)}</Text>
                        </Skeleton>
                    </Flex>

                </Box>
                
                <Box bg='white' p='2vw' width="calc(100vw - 380px)" overflow={'scroll'}>
                <Flex gap='3vw' justifyContent={'space-between'}> 
                    <Flex  flex='1' gap='20px'  alignItems={'center'}>
                        <Avatar />
                        <Skeleton width={'100%'} isLoaded={clientDataEdit !== null}> 
                            <EditText nameInput={true} size='md' maxLength={70} updateData={updateData} value={clientDataEdit?.name === ''? 'Cliente de la Web':clientDataEdit?.name} setValue={handelChangeName}/>
                        </Skeleton>
                    </Flex>
                    <Flex alignItems={'center'} gap='10px'>
                        <Button leftIcon={clientDataEdit?.is_blocked?<TbKey/>:<MdBlock/>} onClick={() => {if (!clientDataEdit?.is_blocked) setShowBlock(true); else updateData({...clientDataEditRef.current as ClientData, is_blocked:false})}} color={clientDataEdit?.is_blocked?'black':'red'} fontSize={'1em'} size='sm' fontWeight={'medium'}  _hover={{color:clientDataEdit?.is_blocked?'blue.500':'red.600'}}>{clientDataEdit?.is_blocked?'Desbloquear':'Bloquear'}</Button>
                        <Button leftIcon={<TbArrowMerge/>} onClick={() => setShowMerge(true)} fontSize={'1em'} size='sm' fontWeight={'medium'}  _hover={{color:'blue.500'}}>Fusionar</Button>
                    </Flex>
                </Flex>
                <Box width={'100%'} mt='3vh' mb='3vh' height={'1px'} bg='gray.300'/>
                <Skeleton isLoaded={clientDataEdit !== null}> 
                    <Text fontWeight={'medium'}>{clientTicketsEdit?.page_data.length} Conversaci{clientTicketsEdit?.page_data.length === 1 ? 'ón':'ones'}</Text>
                </Skeleton>

                <Flex p='10px' alignItems={'center'} justifyContent={'end'} gap='10px' flexDir={'row-reverse'}>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowForward />} isDisabled={ticketsFilters.page_index > Math.floor((clientTickets?.total_tickets || 0)/ 25)} onClick={() => updateTable({...ticketsFilters,page_index:ticketsFilters.page_index + 1})}/>
                    <Text fontWeight={'medium'} fontSize={'.9em'} color='gray.600'>Página {ticketsFilters.page_index}</Text>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowBack />} isDisabled={ticketsFilters.page_index === 1} onClick={() => updateTable({...ticketsFilters,page_index:ticketsFilters.page_index - 1})}/>
                </Flex>
                <Skeleton isLoaded={clientTicketsEdit !== null}> 
                    <Table data={clientTicketsEdit?.page_data} updateData={updateTable} filters={ticketsFilters} maxWidth="calc(96vw - 380px)" section="clients" />
                </Skeleton>
            </Box>
            </Flex>

            {showMerge && memoizedMergeBox}
            {showBlock && memoizedBlockBox}
        </>:
        <> 
            {!comesFromTicket && <Business  socket={socket} comesFromTicket={true} businessData={businessData ? businessData:businessDataEdit} setBusinessData={setBusinessData? setBusinessData:setBusinessDataEdit} businessClients={businessClients?businessClients:businessClientsEdit} setBusinessClients={setBusinessClients?setBusinessClients:setBusinessClientsEdit}  addHeaderSection={addHeaderSection}/>}
        </>}
        
    </Suspense>)
    }

export default Client


 
interface MergeBoxProps {
    clientData:ClientData | null
    setShowMerge: Dispatch<SetStateAction<boolean>>
    deleteHeaderSection: DeleteHeaderSectionType
}

const MergeBox = ({clientData, setShowMerge, deleteHeaderSection}:MergeBoxProps) => {

    //AUTH CONSTANT
    const auth = useAuth()
    const session = useSession()
    const navigate = useNavigate()

    //SHOW CONFIRM
    const [showConfirmMerge, setShowConfirmMerge] = useState<boolean>(false)
    const [waitingConfirmMerge, setWaitingConfirmMerge] = useState<boolean>(false)

    //SHOW BOX ON WRITE TEXT AND FIND COINCIDENCE, MAKING CALLS TO CLIENTS ENDPOINT
    const [waitingResult, setWaitingResult] = useState<boolean>(false)
    const boxRef = useRef<HTMLDivElement>(null) 
    
    useOutsideClick({ref1:boxRef, onOutsideClick:(b:boolean) => {setText('')}})
    const [text, setText] = useState<string>('')
    const [showResults, setShowResults] = useState<boolean>(false)
    const [elementsList, setElementsList] = useState<any>([])
    const [selectedClient, setSelectedClient] = useState<{name:string, id:number} | null>(null)
    
    useEffect(() => {
        if (text === '') {setWaitingResult(false);setShowResults(false);return}
            const timeoutId = setTimeout(async () => {
            setWaitingResult(true)
            const response = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/clients`, setValue:setElementsList, auth:auth, params: { page_index: 1, search: text }})
            if (response?.status === 200) {setShowResults(true);setWaitingResult(false)}
            else {setShowResults(false);setWaitingResult(false)}
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [text])


    const confirmMerge = async () => {
        const response = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/clients/merge/${clientData?.id}/${selectedClient?.id}`, method:'put', setWaiting:setWaitingConfirmMerge, params: { newName:clientData?.name}, auth: auth, toastMessages:{'works':`${clientData?.name} y ${selectedClient?.name} se han fusionado correctamente`,'failed':'Hubo un fallo al fusionar los clientes'}})
        if (response?.status === 200) {
            session.dispatch({type:'DELETE_VIEW_FROM_CLIENT_LIST'})
            deleteHeaderSection({code:clientData?.id || 0, type:'client', description:'' })
            navigate('/clients')
        }
    }


    return(<>
            <Box p='15px'> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>Fusionar con otro usuario</Text>
                <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>  
                
                {showConfirmMerge ? 
                <ConfirmmBox setShowBox={setShowConfirmMerge}> 
                    <Box p='15px'> 
                        <Text fontWeight={'medium'} fontSize={'1.2em'}>Confirmar fusión</Text>
                        <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
                        <Text>¿Desea fusionar a  <span style={{fontWeight:'medium'}}> {clientData?.name}</span> y a <span style={{fontWeight:'medium'}}> {selectedClient?.name}</span></Text>
                    </Box>
                    <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                        <Button  size='sm' bg={'brand.gradient_blue'} _hover={{bg:'gradient_blue_hover'}} color={'white'} onClick={confirmMerge}>{waitingConfirmMerge?<LoadingIconButton/>:'Fusionar'}</Button>
                        <Button  size='sm' onClick={()=>setShowConfirmMerge(false)}>Cancelar</Button>
                    </Flex>
                </ConfirmmBox>
                :
                <> 
                <Text mb='1vh' fontWeight={'medium'}>Busque un cliente para fusionar</Text>
                <Box position={'relative'}> 
                    <EditText waitingResult={waitingResult} value={text} setValue={setText} searchInput={true}/>
                
                    {(showResults && 'page_data' in elementsList) && 
                        <Box  maxH='30vh' overflow={'scroll'} width='100%' gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.3)'} bg='white' zIndex={100000} className={'slide-down'} position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.200'}>
                            {elementsList.page_data.length === 0? 
                            <Box p='15px'><Text>No hay ninguna coincidencia</Text></Box>
                            :<> {elementsList.page_data.map((client:ClientData, index:number) => (
                                <Flex _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'} onClick={() => {setText('');setSelectedClient({id:client.id, name:client.name});setShowResults(false)}} key={`user-${index}`} p='10px' gap='15px' >
                                    <Avatar size='xs' name={client.name}/>
                                    <Box>
                                        <Text fontWeight={'medium'}>{client.name}</Text>
                                    </Box>
                                </Flex>
                            ))}</>}
                        </Box>}

                </Box>

                <Flex mt='20vh' justifyContent={'center'} gap='20px' alignItems={'center'}>
                    <Flex alignItems={'center'} p='10px' gap='15px' bg='gray.50' borderColor={'gray.300'} borderWidth='1px' borderRadius={'.5rem'}>
                        <Avatar size='sm'/>
                        <Box>
                            <Text fontWeight={'medium'}>{clientData?.name}</Text>
                        </Box>
                    </Flex>
                    <Icon as={FaArrowRight} boxSize={'25px'}/>
                    {selectedClient === null ? <Text fontSize={'.9em'} width={'150px'} textAlign={'center'}>Seleccione un cliente para fusionar</Text>
                    :<Flex alignItems={'center'} p='10px' gap='15px' bg='gray.50' borderColor={'gray.300'} borderWidth='1px' borderRadius={'.5rem'}>
                        <Avatar size='sm'/>
                        <Box>
                            <Text fontWeight={'medium'}>{selectedClient?.name}</Text>
                        </Box>
                    </Flex>}
                </Flex>
                </>}
            </Box>
          
            <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                <Button  size='sm' bg='brand.gradient_blue' color='white' _hover={{bg:'brand.gradient_blue_hover'}}  isDisabled={selectedClient === null} onClick={()=>setShowConfirmMerge(true)}>{showConfirmMerge?'Confirmar y fusionar':'Fusionar'}</Button>
                <Button  size='sm' onClick={()=>setShowMerge(false)}>Cancelar</Button>
            </Flex>
        </>
    )
}

