/*
    MAIN CLIENT FUNCTION (clients/client/{client_id} or tickets/ticket/{ticket_id}/client)
*/

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, Dispatch, SetStateAction } from "react"
import { useAuth } from "../../../AuthContext"
import { useSession } from "../../../SessionContext"
import { useLocation, useNavigate } from "react-router-dom"
import DOMPurify from 'dompurify'
//FRONT
import { Flex, Box, Text, Icon, Textarea, Avatar, Skeleton, IconButton} from '@chakra-ui/react'
//FETCH DATA
import fetchData from "../../API/fetchData"
//COMPONENTS
import Table from "../Clients/Table"
import EditText from "../../Components/EditText"
//FUNCTIONS
import timeAgo from "../../Functions/timeAgo"
//ICONS
import { FaBuilding } from "react-icons/fa6"
import { RxCross2 } from "react-icons/rx"
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io"
//TYPING
import { Clients, HeaderSectionType, ContactBusinessesTable, Channels, ClientColumn } from "../../Constants/typing"
 

//TYPING
interface BusinessProps {
    comesFromTicket:boolean
    addHeaderSection:HeaderSectionType
    businessData?:ContactBusinessesTable | null
    setBusinessData?:Dispatch<SetStateAction<ContactBusinessesTable | null>>
    businessClients?:Clients | null
    setBusinessClients?:Dispatch<SetStateAction<Clients | null>>
    socket:any
}
 
 
//MAIN FUNCTION
function Business ({comesFromTicket, socket, addHeaderSection, businessData, setBusinessData, businessClients, setBusinessClients  }: BusinessProps) {
    
    //CONSTANTS
    const auth = useAuth()
    const session = useSession()
    const location = useLocation().pathname
    const navigate = useNavigate()
    
    //SCROLL REFS
    const scrollRef1 = useRef<HTMLDivElement>(null)

    //WEBSOCKET ACTIONS, THEY TRIGEGR ONLY IF THE USER IS INSIDE THE SECTION
    useEffect(() => {
        socket?.current.on('business_contact', (data:any) => {
        if (data?.is_new){
            if (setBusinessData) setBusinessData(data.data)
            else setBusinessDataEdit(data.data)
        }
    })},[])

    //BUSINESS DATA
    const [businessDataEdit, setBusinessDataEdit] = useState<ContactBusinessesTable | null>(comesFromTicket ? businessData ?? null : null)
    const businessDataEditRef = useRef<ContactBusinessesTable | null>(comesFromTicket ? businessData ?? null : null)
    useEffect(() => {
        if (businessData) {
            businessDataEditRef.current = businessData
            setBusinessDataEdit(businessData)
        }
    }, [businessData])

    //TABLE OF CLIENTS
    const [businessClientsEdit, setBusinessClientsEdit] = useState<Clients | null>(comesFromTicket ? businessClients ?? null : null)
    const [clientsFilters, setClientsFilters ] = useState<{page_index:number, channel_types:Channels[], sort_by?:ClientColumn , search?:string, order?:'asc' | 'desc'}>({page_index:1, channel_types:[]}) 
    useEffect(() => {
        if (businessClients) setBusinessClientsEdit(businessClients)       
    }, [businessClients])
    
    //REQUEST CLIENT, CONVERSATIONS AND CLIENT INFO
    useEffect(() => { 
        const loadData = async () => {

            if (!comesFromTicket) {

                //FIND BUSINESS ELEMENT IN SECTIONS
                const businessId = parseInt(location.split('/')[location.split('/').length - 1])
                const headerSectionsData = session.sessionData.headerSectionsData
                const businessElement = headerSectionsData.find(value => value.id === businessId && value.type === 'business')
                    
                //SET TITLE
                document.title = `Empresa de Contacto: ${location.split('/')[location.split('/').length - 1]} - ${auth.authData.organizationName} - Matil`
                localStorage.setItem('currentSection', `contact-businesses/business/${businessId}`)

                //SET DATA IF BUSINESS FOUND
                if (businessElement && businessElement.data.businessData ) {
                    setBusinessDataEdit(businessElement.data.businessData)
                    businessDataEditRef.current = businessElement.data.businessData
                    if (businessElement.data.businessClients) setBusinessClientsEdit(businessElement.data.businessClients)
                    else {
                        const businessClientsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients`, params:{page_index:1, contact_business_id:businessElement.data.businessData.id}, setValue:setBusinessClientsEdit, auth })
                    }
                }

                //FETCH THE DATA
                else {
                    const businessResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses/${businessId}`, setValue:setBusinessDataEdit,  auth})    
 
                    if (businessResponse?.status === 200 ) {
                        addHeaderSection(businessResponse.data.name , businessResponse.data.id, 'contact-business')
                        const businessClientsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients`, params:{page_index:1, contact_business_id:businessResponse.data.id}, setValue:setBusinessClientsEdit, auth })
                        businessDataEditRef.current = businessResponse?.data
                        session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{type:'business', id: businessId, data:{businessData:businessResponse?.data, businessClients:businessClientsResponse?.data} }}})
                    }
                    else navigate('/contact-businesses')
                    
                }
            }
            else {
                if (!businessClients) await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients`, params:{page_index:1, contact_business_id:businessData?.id}, setValue:setBusinessClients, auth })

            }
        }
        loadData()
        }, [location])
  
    //UPDATE CLIENTS TABLE
    const updateTable = async(applied_filters:{page_index:number, channel_types:Channels[], sort_by?:ClientColumn , search?:string, order?:'asc' | 'desc'} | null) => {

        let filtersToSend = applied_filters ? applied_filters:{page_index:1, channel_types:[]}
        const clientsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients`, params:{...filtersToSend, contact_business_id:businessDataEdit?.id}, setValue:setBusinessClientsEdit, auth })         
        if (clientsResponse?.status == 200) setClientsFilters(filtersToSend)
        
    }
      

    //TRIGGER UPDATE DATA ON CHANGES
    const updateData = async(newData?:ContactBusinessesTable | null) => {

        const compareData = newData ?newData:businessDataEdit as ContactBusinessesTable

        if (JSON.stringify(businessDataEditRef.current) !== JSON.stringify(compareData)){
            const updateResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses/${businessDataEdit?.id}`, auth:auth, requestForm:compareData, method:'put', toastMessages:{'works':`La empresa #/{${businessDataEdit?.id}}/ se actualizó correctamente.`,'failed':`Hubo un problema al actualizar la información.`}})
            if (updateResponse?.status === 200) {
                businessDataEditRef.current = compareData
                if (comesFromTicket && setBusinessData) setBusinessData(compareData)
            }
        }
    }

    ///////////////////////////
    //EDIT DATA LOGIC   
    ///////////////////////////

    //NOTES LOGIC
    const textareaNotasRef = useRef<HTMLTextAreaElement>(null)
    const adjustTextareaHeight = (textarea:any) => {
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
    }
    const handleInputNotasChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
         setBusinessDataEdit(prevData => prevData ? ({ ...prevData, notes:DOMPurify.sanitize(event.target.value)}) as ContactBusinessesTable : null)
    }
    useEffect(() =>{if (businessDataEdit) adjustTextareaHeight(textareaNotasRef.current)}, [businessDataEdit?.notes])

    //TAGS LOGIC
    const [inputValue, setInputValue] = useState<string>('')
 
 
    const handleKeyDown = (event:KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          const newTag = inputValue.trim()
          if (newTag) {
            let newClientData:ContactBusinessesTable | null = null
            if (businessDataEdit) {
                const labelsArray = businessDataEdit.labels ? businessDataEdit.labels.split(',') : []
                labelsArray.push(newTag)
                newClientData = { ...businessDataEdit, labels: labelsArray.join(',') }
            }
            updateData(newClientData)
            setBusinessDataEdit(newClientData)
            setInputValue('')
          }
        }
      } 
    const removeTag = (index: number) => {
        let newClientData:ContactBusinessesTable | null = null
        if (businessDataEdit && businessDataEdit.labels) {
            const labelsArray = businessDataEdit.labels.split(',')
            labelsArray.splice(index, 1)
            newClientData = { ...businessDataEdit, labels: labelsArray.join(',') }
          }
          updateData(newClientData)
          setBusinessDataEdit(newClientData)
    }

    //CHANGE NAME
    const handelChangeName = (value:string) => {
        if (businessDataEdit) setBusinessDataEdit(prevData => prevData ? ({ ...prevData, name:value}) as ContactBusinessesTable : null)
    }
    
    return (<> 
 

        {!comesFromTicket && 
            <Flex px='30px' height='60px' bg='gray.100' borderBottomWidth={'1px'} borderBottomColor='gray.200' flex='1' alignItems={'center'} >
                <Flex borderRadius={'.3rem'} height={'70%'}  alignItems={'center'} borderWidth={'1px 1px 1px 1px'}  borderColor='gray.300'> 
                    <Flex alignItems='center' gap='6px' cursor={'pointer'}  bg={'gray.300'} height={'100%'}  borderRightWidth={'1px'} borderRightColor='gray.300'  px={{md:'10px',lg:'20px'}}> 
                        <Icon as={FaBuilding} boxSize={'14px'} />
                        <Skeleton isLoaded={businessDataEdit !== null}> <Text whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}}>{businessDataEdit?businessDataEdit?.name:'Sin empresa (Crear)'}</Text></Skeleton>
                    </Flex> 
                </Flex>
            </Flex>
        }

     
        <Flex height={'calc(100vh - 120px)'}  width={'100%'}>
            <Box ref={scrollRef1} p='2vw' bg='gray.50' width={'320px'} borderRightWidth={'1px'} borderRightColor='gray.200' overflow={'scroll'}  >
             
            <Flex mt='3vh' gap='10px'> 
                        <Box width={'70px'} mt='11px'> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Etiquetas</Text>
                        </Box>
                        <Skeleton isLoaded={businessDataEdit !== null}> 
                            <Box flex='1'> 
                                <Box   minHeight="30px" maxH="300px" border="1px solid transparent"   p="5px" _hover={{ border: "1px solid #CBD5E0" }} _focusWithin={{ borderColor:'transparent', boxShadow:'0 0 0 2px rgb(77, 144, 254)'}} borderRadius=".5rem" overflow="auto" display="flex" flexWrap="wrap" alignItems="center" onKeyDown={handleKeyDown}  tabIndex={0}>
                                    {(businessDataEdit?.labels === null || businessDataEdit?.labels === '') ? <></>:
                                    <> 
                                        {((businessDataEdit?.labels || '').split(',')).map((label, index) => (
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
                            <Text fontSize='.8em'  mt='11px'fontWeight={'medium'} color='gray' >Notas</Text>
                        </Box>
                        <Skeleton isLoaded={businessDataEdit !== null}> 
                            <Box flex='1'> 
                                <Textarea  maxLength={1000} onBlur={() => updateData()} minHeight={'37px'} placeholder="Notas..." maxH='300px' value={businessDataEdit?.notes} ref={textareaNotasRef} onChange={handleInputNotasChange} size='sm' p='8px'  resize={'none'} borderRadius='.5rem' rows={1} fontSize={'.9em'}  borderColor='transparent' _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                            </Box>
                        </Skeleton>
                    </Flex>
                    
                    <Flex mt='3vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Creado</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={businessDataEdit !== null}> 
                           <Text fontSize={'.9em'}>{timeAgo(businessDataEdit?.created_at)}</Text>
                        </Skeleton>
                    </Flex>

                    <Flex mt='3vh' alignItems={'center'} gap='10px'> 
                        <Box width={'70px'}> 
                            <Text fontSize='.8em' fontWeight={'medium'} color='gray' >Última interacción</Text>
                        </Box>
                        <Skeleton   flex='1'isLoaded={businessDataEdit !== null}> 
                           <Text fontSize={'.9em'}>{timeAgo(businessDataEdit?.last_interaction_at)}</Text>
                        </Skeleton>
                    </Flex>
            </Box>
            
            <Box bg='white' p='2vw' width="calc(100vw - 380px)" overflow={'scroll'}>
            <Flex gap='3vw' justifyContent={'space-between'}> 
                <Flex  flex='1' gap='20px'  alignItems={'center'}>
                    <Avatar />
                    <Skeleton width={'100%'} isLoaded={businessDataEdit !== null}> 
                        <EditText nameInput={true} size='md' maxLength={70} updateData={updateData} value={businessDataEdit?.name === ''? 'Cliente de la Web':businessDataEdit?.name} setValue={handelChangeName}/>
                    </Skeleton>
                </Flex>
            </Flex>

            <Box width={'100%'} mt='3vh' mb='3vh' height={'1px'} bg='gray.300'/>
            <Skeleton isLoaded={businessClientsEdit !== null}> 
                <Text fontWeight={'medium'}>{businessClientsEdit?.page_data.length} Cliente{businessClientsEdit?.page_data.length === 1 ? '':'s'} asociado{businessClientsEdit?.page_data.length === 1 ? '':'s'}</Text>
            </Skeleton>

            <Flex p='10px' alignItems={'center'} justifyContent={'end'} gap='10px' flexDir={'row-reverse'}>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowForward />} isDisabled={clientsFilters.page_index > Math.floor((businessClientsEdit?.total_clients || 0)/ 25)} onClick={() => updateTable({...clientsFilters,page_index:clientsFilters.page_index + 1})}/>
                    <Text fontWeight={'medium'} fontSize={'.9em'} color='gray.600'>Página {clientsFilters.page_index}</Text>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowBack />} isDisabled={clientsFilters.page_index === 1} onClick={() => updateTable({...clientsFilters,page_index:clientsFilters.page_index - 1})}/>
                </Flex>
            <Skeleton isLoaded={businessClientsEdit !== null}> 
                <Table data={businessClientsEdit?.page_data} updateData={updateTable} filters={clientsFilters} maxWidth="calc(96vw - 380px)"/>
            </Skeleton>
        </Box>
        </Flex>

      
     </>)
}

export default Business

 