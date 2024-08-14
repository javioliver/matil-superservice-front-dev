//REACT
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../AuthContext"
import { useSession } from "../../../SessionContext"
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Box, Text, Button, IconButton, Skeleton } from '@chakra-ui/react'
//COMPONENTS
import EditText from "../../Components/EditText"
import AccionesButton from "../Tickets/ActionsButton"
import FilterButton from "../../Components/FilterButton"
import Table from "./Table"
//ICONS
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6" 
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"
import { PiDesktopTowerFill } from "react-icons/pi"
//TYPING
import { Flows, Channels, logosMap, FlowsColumn } from "../../Constants/typing"
 
interface ClientsFilters {
    page_index:number
    channel_types:Channels[]
    search?:string
    sort_by?:FlowsColumn
    order?:'asc' | 'desc'
}

//MAIN FUNCTION
function FlowsTable () {

    //TRANSLATION
    const { t } = useTranslation('flows')

    //AUTH CONSTANT
    const navigate = useNavigate()
    const auth = useAuth()
    const session = useSession()

    //CONTAINER REF
    const containerRef = useRef<HTMLDivElement>(null)

    //BOOLEAN FOR WAIT THE INFO
    const [waitingInfo, setWaitingInfo] = useState<boolean>(true)

    //SELECT DATA LOGIC
    const [flows, setFlows] = useState<Flows | null>(null)
    const [filters, setFilters] = useState<ClientsFilters>({page_index:1, channel_types:[]})
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)

    //FETCH DATA ON FIRST RENDER
    useEffect(() => {
        document.title = `${t('Flows')} - ${auth.authData.organizationName} - Matil`
        localStorage.setItem('currentSection', `flows`)

        const fetchClientsData = async() => {
            if (session.sessionData.flowsTable) {
                setFlows(session.sessionData.flowsTable.data)
                setFilters(session.sessionData.flowsTable.filters)
                setSelectedIndex(session.sessionData.flowsTable.selectedIndex)
                setWaitingInfo(false)
            }
            else {
                const flowsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/flows`, setValue:setFlows, setWaiting:setWaitingInfo, params:{page_index:1},auth:auth})
                if (flowsResponse?.status === 200) session.dispatch({type:'UPDATE_CLIENTS_TABLE',payload:{data:flowsResponse?.data, filters, selectedIndex:-1}})

                else session.dispatch({type:'UPDATE_CLIENTS_TABLE',payload:{data:{
                    page_data:[{id:1, name: 'Flujo 1', description:'bla bla bal bao3oedj3 rfiu3 rfiugo3', status: 'active', channel: 'whatsapp', created_at:'', updated_at:''}],
                    total_flows:1,
                    page_index:1,
                }, filters, selectedIndex:-1}})
                setFlows({
                    page_data:[{id:1, name: 'Flujo 1', description:'bla bla bal bao3oedj3 rfiu3 rfiugo3', status: 'active', channel: 'whatsapp', created_at:'', updated_at:''}],
                    total_flows:1,
                    page_index:1
                })
            }
        }    
        fetchClientsData()
    }, [])


    //FETCH NEW DATA ON FILTERS CHANGE
    const fetchClientDataWithFilter = async (filters:{page_index:number, channel_types:Channels[], sort_by?:FlowsColumn, search?:string, order?:'asc' | 'desc'}) => {
        setFilters(filters)
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/flows`, setValue:setFlows, setWaiting:setWaitingInfo, params:filters, auth})
        if (response?.status === 200) {            
            session.dispatch({ type: 'UPDATE_FLOWSS_TABLE', payload: {data:response.data, filters:filters, selectedIndex} })
         }
    }

    //SELECT CHANNELS LOGIC
    const toggleChannelsList = (element: Channels) => {
        const channelsList = filters.channel_types
        if (channelsList.includes(element)) setFilters({...filters, channel_types: channelsList.filter(e => e !== element)})
        else setFilters({...filters, channel_types: [...channelsList, element]})
    }

    //FRONT
    return(
        <Box bg='white' height={'calc(100vh - 60px)'} maxW={'calc(100vw - 60px)'} overflowX={'scroll'} overflowY={'hidden'}  p='2vw'>
    
            <Flex justifyContent={'space-between'} alignItems={'end'}> 
                <Text fontWeight={'medium'} fontSize={'1.5em'}>{t('Flows')}</Text>
                <AccionesButton items={flows ? flows.page_data:[]} view={null} section={'flows'}/>
             </Flex>
            <Flex justifyContent={'space-between'} alignItems={'end'} gap='20px'  > 
                <Flex gap='20px' alignItems={'center'} mt='3vh' flex='1' ref={containerRef} px='4px' overflowX={'scroll'}>
                    <Box minW='200px' width={'300px'} alignItems={'center'} >
                        <EditText value={filters.search} setValue={(value:string) => setFilters({...filters, search:value})} searchInput={true}/>
                    </Box> 
       
                    <FilterButton selectList={Object.keys(logosMap)} selectedElements={filters.channel_types} setSelectedElements={(element) => toggleChannelsList(element as Channels)} icon={PiDesktopTowerFill} filter='channels'/>
                    <Button whiteSpace='nowrap'  minWidth='auto'leftIcon={<FaMagnifyingGlass/>} size='sm' onClick={() => fetchClientDataWithFilter({...filters,page_index:1})}>Aplicar filtros</Button>

                </Flex>
                <Button whiteSpace='nowrap'  minWidth='auto'leftIcon={<FaPlus/>} size='sm' onClick={() => navigate('/flows/flow/create')}>{t('create')}</Button>

             </Flex>
            <Box bg={'gray.200'} height={'1px'} mt='3vh' mb='3vh' width='100%'/>

            <Skeleton isLoaded={!waitingInfo}> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>{flows?.total_flows} {t('flows', {count:flows?.total_flows})}</Text>
            </Skeleton>
            
            {/*TABLA*/}
            <Box> 
                <Flex p='10px' alignItems={'center'} justifyContent={'end'} gap='10px' flexDir={'row-reverse'}>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowForward />} isDisabled={filters.page_index >= Math.floor((flows?.total_flows || 0)/ 50)} onClick={() => fetchClientDataWithFilter({...filters,page_index:filters.page_index + 1})}/>
                    <Text fontWeight={'medium'} fontSize={'.9em'} color='gray.600'>Página {filters.page_index}</Text>
                    <IconButton isRound size='xs' aria-label='next-page' icon={<IoIosArrowBack />} isDisabled={filters.page_index === 1} onClick={() => fetchClientDataWithFilter({...filters,page_index:filters.page_index - 1})}/>
                </Flex>
            
                <Skeleton isLoaded={!waitingInfo}> 
                    <Table data={flows?.page_data} updateData={fetchClientDataWithFilter} filters={filters} currentIndex={selectedIndex}  maxWidth={'calc(96vw - 60px)'}/>
                </Skeleton>
            </Box>
    
        </Box>
        )
}

export default FlowsTable

 