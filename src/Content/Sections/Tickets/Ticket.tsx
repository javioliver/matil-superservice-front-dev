  /*
  MAIN TICKET FUNCTION TO HANDLE CLIENT AND TICKET INFORMATION (/tickets/{ticket_id})
*/

//REACT
import { useState, useEffect, Suspense, lazy } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useSession } from "../../../SessionContext"
import { useAuth } from "../../../AuthContext"
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Skeleton, Text, Icon } from '@chakra-ui/react'
//COMPONENTS
import StateMap from "../../Components/StateMap"
import ConfirmBox from "../../Components/ConfirmBox"
import CreateBusiness from "../Businesses/CreateBusiness"
//ICONS
import { BsPersonFill } from "react-icons/bs" 
import { FaBuilding } from "react-icons/fa6"
//TYPING
import { Tickets, TicketData, ClientData, MessagesData, HeaderSectionType, ContactBusinessesTable, DeleteHeaderSectionType, Clients } from "../../Constants/typing" 
 
//SECTIONS
const TicketResponse = lazy(() => import('./TicketResponse'))
const Client = lazy(() => import('../Clients/Client'))
const Business = lazy(() => import('../Businesses/Business'))
 
//TYPING
interface TicketProps {
  addHeaderSection:HeaderSectionType
  deleteHeaderSection: DeleteHeaderSectionType
  socket:any
}

//MAIN FUNCTION
function Ticket ({ addHeaderSection, deleteHeaderSection, socket }:TicketProps) {
    
    //TRANSLATION
    const { t } = useTranslation('tickets')

    //CONSTANTS
    const auth = useAuth()
    const session = useSession()
    const location = useLocation().pathname
    const navigate = useNavigate()

    //CURRENT SECTION
    const [ticketSection, setTicketSection] = useState<'ticket' | 'client' | 'business'>('ticket')
  
    //ALL TICKET DATA
    const [ticketData, setTicketData] = useState<TicketData | null>(null)

    //GET CONVERSATIONS INFO
    const [messagesList, setMessagesList] = useState<MessagesData | null>(null)

    //SAVE USER INFO
    const [clientData, setClientData] = useState<ClientData | null>(null)
    const [clientId, setClientId] = useState<number>(-1)

    //CLIENT TICKETS
    const [clientTickets, setClientTickets] = useState<Tickets | null>(null)

    //SAVE CONTACT BUSINESS INFO
    const [businessData, setBusinessData] = useState<ContactBusinessesTable | null>(null)
    
    //BUSINESS CLIENTS
    const [businessClients, setBusinessClients] = useState<Clients | null>(null)

    //REQUEST TICKET, CONVERSATIONS AND CLIENT INFO
    useEffect(() => { 
       const loadData = async () => {

        localStorage.setItem('currentSection', location)
        
        //FIND IF TGHE TICKET IS OPENED
        const ticketId = parseInt(location.split('/')[location.split('/').length - 1])

        const ticketSectionData = session.sessionData.headerSectionsData
        const ticketElement = ticketSectionData.find(value => value.id === ticketId && value.type === 'ticket')
 
        //EDIT UNSEEEN CHANGES ON ENTER
        session.dispatch({type: 'CHANGE_UNSEEN_CHANGES', payload: ticketId})
        
        //TICKET IS OPENED
        if (ticketElement) {
          setTicketData(ticketElement.data.ticketData)
          setMessagesList(ticketElement.data.messagesList)
          setClientData(ticketElement.data.clientData)

          if (ticketElement.data.clientTickets) setClientTickets(ticketElement.data.clientTickets)
          else {
            const reponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, params:{page_index:1, view_index:0,view_type:'', retrieve_exclusively_for_client:true, client_id:ticketElement.data.clientData?.id}, setValue:setClientTickets, auth })         
            session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{id:ticketId, type:'ticket', data:{...ticketElement.data ,clientTickets:reponse?.data}}}})
          }
          setBusinessData(ticketElement.data.businessData)
          setBusinessClients(ticketElement.data.businessClients)
        }

        //CALL THE API AND REQUEST (TICKET DATA, CONTACT BUSINESS, CLIENT DATA, CLIENT TICKETS AND CONTACT BUSINESS)
        else {
          const ticketResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets/${ticketId}`, setValue:setTicketData, auth})
          if (ticketResponse?.status === 200) {
            const data = ticketResponse?.data

            addHeaderSection(data.title ? data.title: 'Sin descripción', data.id, 'ticket',data.local_id)
            document.title = `Ticket: ${data.local_id} - ${auth.authData.organizationName} - Matil`
 
            socket.current.emit(JSON.stringify({event: 'open_conversation', data:{id:ticketResponse?.data.conversation_id , access_token: auth.authData.accessToken, organization_id: auth.authData.organizationId}}))
            if (data) {
              const messagesResponse = await fetchData({endpoint:`conversations/${data.conversation_id}`, auth})

              if (messagesResponse?.status === 200) { 
                setClientId(messagesResponse.data.client_id)
                setMessagesList({messages: messagesResponse.data.messages, extracted_data:messagesResponse.data.extracted_data, scheduled_messages:messagesResponse.data.scheduled_messages})
      
                  const clientResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${messagesResponse?.data?.client_id}`, setValue:setClientData, auth })
                   
                  if (clientResponse?.status === 200)
                    {
                      const ticketsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/tickets`, params:{page_index:1, view_index:0,view_type:'', retrieve_exclusively_for_client:true, client_id:clientResponse.data.id}, setValue:setClientTickets, auth })         
                      
                      let businessDict:ContactBusinessesTable = {id:-1, domain: '',name:'', notes: '', labels:'', created_at:'', last_interaction_at:''}
                      if (clientResponse.data.contact_business_id && clientResponse.data.contact_business_id !== -1)  {
                        const businessResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/contact_businesses/${clientResponse.data.contact_business_id}`, setValue:setBusinessData, auth })
                        businessDict = businessResponse?.data
                      }
                      else setBusinessData(businessDict)
                      
                      if (ticketsResponse?.status === 200) {
                          session.dispatch({type:'UPDATE_HEADER_SECTIONS',payload:{action:'add', data:{id:ticketId, type:'ticket', data:{ticketData:ticketResponse.data, clientData:clientResponse.data, messagesList:{messages: messagesResponse.data.messages, extracted_data:messagesResponse.data.extracted_data, scheduled_messages:messagesResponse.data.scheduled_messages}, clientTickets:ticketsResponse?.data, businessData:businessDict}}}})
                      }
                  }
              }
            }
          }   
          else navigate('/tickets')
        }
      }
      loadData()
     }, [location])
 
    //CREATE A NEW CONTACT BUSINESS, FOR AN EXISTING CLIENT
    const handleCreateContactBusiness = async (new_data:ContactBusinessesTable) => {
      setBusinessData(new_data)
      const newClientData = {...clientData as ClientData, contact_business_id:new_data?.id }
      const updateResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${clientData?.id}`, auth:auth, requestForm:newClientData, method:'put'})
      if (updateResponse?.status === 200) setClientData(newClientData)
    }

    //FRONT
    return(
        <>
        <Flex overflowX={'scroll'} width={'calc(100vw - 60px)'} px='30px' height='60px' bg='gray.100' borderBottomWidth={'1px'} borderBottomColor='gray.200' flex='1' alignItems={'center'} >
            <Flex borderRadius={'.3rem'} height={'70%'}  alignItems={'center'} borderWidth={'1px 1px 1px 1px'}  borderColor='gray.300'> 
                
                <Flex alignItems='center' gap='6px'   cursor={'pointer'}  bg={ticketSection === 'business' ?  'gray.300':'transparent' } height={'100%'}  borderRightWidth={'1px'} borderRightColor='gray.300'  px={{md:'10px',lg:'20px'}}> 
                    <Icon as={FaBuilding} boxSize={'14px'} />
                    <Skeleton isLoaded={businessData !== null}> <Text whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}} >{businessData?.id === -1?t('NoBusiness'):businessData?.name}</Text></Skeleton>
                </Flex> 
                <Flex alignItems='center' gap='6px'  onClick={() => setTicketSection('client')} cursor={'pointer'}  bg={ticketSection === 'client' ?  'gray.300':'transparent'} height={'100%'} borderRightWidth={'1px'} borderRightColor='gray.300'  px={{md:'10px',lg:'20px'}}> 
                    <Icon as={BsPersonFill} boxSize={'17px'} />
                    <Skeleton isLoaded={clientData !== null}> <Text whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}} >{clientData?.name === ''? t('WebClient'):clientData?.name}</Text></Skeleton>
                </Flex> 
                <Flex cursor='pointer' px={{md:'10px',lg:'20px'}} gap='8px' onClick={() => setTicketSection('ticket')} bg={ticketSection === 'ticket' ? 'gray.300': 'transparent' } height={'100%'} alignItems={'center'}> 
                  <Skeleton isLoaded={ticketData !== null}>
                    {ticketData?.status && <StateMap state={ticketData.status}/>}
                  </Skeleton>
                  <Skeleton isLoaded={!ticketData !== null}>
                    <Text  whiteSpace={'nowrap'} fontSize={{md:'.8em',lg:'1em'}} color='gray.600'>{ticketData?.subject} #{ticketData?.local_id}</Text>
                  </Skeleton>
                </Flex>
            </Flex>
        </Flex>

        <Suspense fallback={<></>}>    
          {ticketSection === 'ticket' ?
              <TicketResponse socket={socket}  ticketData={ticketData} setTicketData={setTicketData} messagesList={messagesList}  setMessagesList={setMessagesList} clientData={clientData} setClientData={setClientData} clientId={clientId} clientTickets={clientTickets} setClientTickets={setClientTickets} deleteHeaderSection={deleteHeaderSection}/>
            :
            <> 
              {ticketSection === 'client'?
                <Client socket={socket} comesFromTicket={true} addHeaderSection={addHeaderSection} deleteHeaderSection={deleteHeaderSection} 
                clientData={clientData} setClientData={setClientData} 
                clientTickets={clientTickets} setClientTickets={setClientTickets} 
                businessData={businessData} setBusinessData={setBusinessData} 
                businessClients={businessClients} setBusinessClients={setBusinessClients}  />
                :<>
                  {(businessData?.id !== -1) ? 
                  <Business  socket={socket} comesFromTicket={true} businessData={businessData} setBusinessData={setBusinessData} businessClients={businessClients} setBusinessClients={setBusinessClients}  addHeaderSection={addHeaderSection}/>
                  :
                  <ConfirmBox setShowBox={(key:boolean) => setTicketSection('ticket')}> 
                      <CreateBusiness setShowBox={(key:boolean) => setTicketSection('ticket')} actionTrigger={(data:any) => handleCreateContactBusiness(data)}/>
                  </ConfirmBox>
                  }</>
              
              }
            </>
          }
        </Suspense>
    
        </>
  
        )
}

export default Ticket