//REACT
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../AuthContext"
import { useSession } from "../../../SessionContext"
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Box, Text, Button, Skeleton, Tooltip } from '@chakra-ui/react'
//COMPONENTS
import Table from "../../Components/Reusable/Table"
import EditText from "../../Components/Reusable/EditText"
//FUNCTIONS
import timeStampToDate from "../../Functions/timeStampToString"
import timeAgo from "../../Functions/timeAgo"
//ICONS
import { FaPlus, FaFilter } from "react-icons/fa6" 
//TYPING
import { FlowsData, } from "../../Constants/typing"


//GET THE CELL STYLE
const CellStyle = ({ column, element }:{column:string, element:any}) => {

    const { t } = useTranslation('flows')
    const t_formats = useTranslation('formats').t

    if (column === 'created_at' ||  column === 'updated_at' )  
    return(
        <Tooltip  label={timeStampToDate(element as string, t_formats)}  placement='top' hasArrow bg='white' color='black'  borderRadius='.4rem' fontSize='sm' p='6px'> 
            <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{timeAgo(element as string, t_formats)}</Text>
        </Tooltip>) 
    else if (column === 'is_active' ) return (
        <Box boxShadow={`1px 1px 1px rgba(0, 0, 0, 0.15)`} display="inline-flex" fontSize='.9em' py='2px' px='8px' fontWeight={'medium'} color={element?'green.500':'red.500'}  bg={element?'green.100':'red.100'} borderRadius={'.7rem'}> 
            <Text>{element?t('Active'):t('Inactive')}</Text>
        </Box>)
    else return ( <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}  fontWeight={column === 'name'?'medium':'normal'}  >{element === ''?'-':element}</Text>)
}


//MAIN FUNCTION
function FlowsTable () {

    //TRANSLATION
    const { t } = useTranslation('flows')
    const columnsFlowsMap:{[key:string]:[string, number]} = {name: [t('name'), 200], description: [t('description'),350], is_active: [t('is_active'), 100], number_of_channels:[t('number_of_channels'), 180], created_at:  [t('created_at'), 180],updated_at: [t('updated_at'), 180]}

    //AUTH CONSTANT
    const navigate = useNavigate()
    const auth = useAuth()
    const session = useSession()   

    //SELECT DATA LOGIC
    const [flows, setFlows] = useState<FlowsData[] | null>(null)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)

    //FILTER LOGIC
    const [text, setText]  =useState<string>('')
    const [filteredFlows, setFilteredFlows] = useState<FlowsData[]>([])
    useEffect(() => {
      const filterUserData = () => {
        if (flows) {
            const filtered = flows.filter(flow =>
                flow.name.toLowerCase().includes(text.toLowerCase()) ||
                flow.description.toLowerCase().includes(text.toLowerCase())
            )
            setFilteredFlows(filtered)
        }
      }
      filterUserData()
    }, [text, flows])


    //FETCH DATA ON FIRST RENDER
    useEffect(() => {
        const fetchFlowsData = async() => {
            if (session.sessionData.flowsFunctions.flows) setFlows(session.sessionData.flowsFunctions.flows)
            else {
                const flowsResponse = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/flows`, setValue:setFlows,  auth:auth})
                if (flowsResponse?.status === 200) session.dispatch({type:'UPDATE_FLOWS',payload:{data:flowsResponse?.data}})
            }
        }    
        fetchFlowsData()
    }, [])


    const clickRow = (row:any, index:number) => {
        navigate(`/flows-functions/flows/flow/${row.uuid}`)
        setSelectedIndex(index)
    }

    //FRONT
    return(
        <Box bg='white' height={'100%'} maxW={'calc(100vw - 55px)'} overflowX={'scroll'} overflowY={'hidden'}  px='2vw'>

            <Flex justifyContent={'space-between'} alignItems={'end'}> 
                <Box> 
                    <Text fontSize={'1.4em'} fontWeight={'medium'}>{t('Flows')}</Text>
                </Box>
                <Button size='sm' leftIcon={<FaPlus/>} variant={'common'} onClick={() => navigate('/flows-functions/flows/flow/create')}>{t('CreateFlow')}</Button>
            </Flex>

            <Box mt='2vh' width={'350px'}> 
                <EditText value={text} setValue={setText} searchInput={true}/>
            </Box>
        
            <Skeleton mt='2vh' isLoaded={flows !== null} >
                <Text fontWeight={'medium'} color='gray.600' fontSize={'1.2em'}>{t('flows', {count:filteredFlows?.length})}</Text> 
            </Skeleton>

            <Skeleton isLoaded={flows !== null}> 
                <Table data={filteredFlows as FlowsData[]} CellStyle={CellStyle} excludedKeys={['uuid']} noDataMessage={t('NoFlows')} columnsMap={columnsFlowsMap} onClickRow={clickRow} currentIndex={selectedIndex}/>
            </Skeleton>
        </Box>
        )
}

export default FlowsTable

 