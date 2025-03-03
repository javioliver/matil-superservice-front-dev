//REACT
import { useState, useEffect, useRef, Dispatch, SetStateAction, useMemo, CSSProperties, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../../AuthContext"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Flex, Box, Text, chakra, shouldForwardProp, Button, Portal, Icon, Tooltip, Switch, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Radio, IconButton, Skeleton } from "@chakra-ui/react"
import { motion, isValidMotionProp } from 'framer-motion'
import "../../Components/styles.css"
import LoadingIconButton from "../../Components/Reusable/LoadingIconButton"
//COMPONENTS
import ConfirmBox from "../../Components/Reusable/ConfirmBox"
import SectionSelector from "../../Components/Reusable/SectionSelector"
import ChartComponent from "./ChartsComponent"
import GridLayout from "react-grid-layout"
import 'react-grid-layout/css/styles.css'
import DateRangePicker from "../../Components/Reusable/DatePicker"
import CustomSelect from "../../Components/Reusable/CustomSelect"
import EditText from "../../Components/Reusable/EditText"
import ActionsButton from "../../Components/Reusable/ActionsButton"
import FilterManager from "../../Components/Reusable/ManageFilters"
import ActionsBox from "../../Components/Reusable/ActionsBox"
import RenderSectionPath from "../../Components/Reusable/RenderSectionPath"
//FUNCTIONS
import parseMessageToBold from "../../Functions/parseToBold"
import useOutsideClick from "../../Functions/clickOutside"
import determineBoxStyle from "../../Functions/determineBoxStyle"
//ICONS
import { FaQuestionCircle } from "react-icons/fa"
import { IoStatsChart,  IoSettingsSharp} from "react-icons/io5";
import { FaChartBar, FaChartColumn,FaTable, FaChartLine, FaChartArea, FaChartPie, FaPen, FaPlus,FaClock, FaCalendarDay, FaCalendarWeek, FaCalendarDays, FaClockRotateLeft, FaLock } from "react-icons/fa6"
import { PiNumberCircleFiveFill  } from "react-icons/pi"
import { HiTrash } from "react-icons/hi2"
import { MdOutlineDragIndicator } from "react-icons/md"
import { TiArrowSortedDown } from "react-icons/ti"
import { PiSidebarSimpleBold } from "react-icons/pi"
import { RiEditFill } from "react-icons/ri"
//TYPING
import { ReportType, ChartType, MetricType, metrics, ViewDefinitionType } from "../../Constants/typing" 
  
//TYPING
interface ReportProps {
    reportId?:string
    sideBarWidth:number
    sectionsPath:string[]
    sectionsPathMap:{[key:string]:{icon:{type:'image' | 'emoji' | 'icon', data:string}, name:string}}
    selectedView?:ViewDefinitionType
}

//MOTION BOX
const MotionBox = chakra(motion.div, {shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop)}) 

//INITIAL DATE
const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const formatDate = (date: Date) => date.toISOString().split("T")[0]
const initialRange = `${formatDate(yesterday)} to ${formatDate(today)}`

//MAIN FUNCTION 
const Report = ({reportId, sideBarWidth, sectionsPath, sectionsPathMap, selectedView}:ReportProps) => {
    
    //CONSTANTS
    const { getAccessTokenSilently } = useAuth0()
    const { t } = useTranslation('stats')
    const auth = useAuth()
    const location = useLocation().pathname
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isExpanded = searchParams.get("v") === "expanded"

    const newChart:ChartType = {
        id: '',
        report_id: reportId,
        type: 'KPI',
        title: t('AddChart'),
        date_range_type: 'relative',
        date_range_value: 'Yesterday',
        view_by:{type:'time',configuration:{granularity:'day'}},
        segment_by:{type:null,configuration:{}},
        configuration: {x:0, y:0, h:1, w:2, show_objective:false, objective_value:'0', show_unit:false, unit:''},
        metrics: [{id:'', report_chart_id: '',aggregation_type:'count', metric_name: 'total_conversations',  legend_label: '', configurations: {}, filters:{logic:'AND', groups:[]}}],
        data: []
    }

    //REPORT DATA 
    const reportDataRef = useRef<ReportType | null>(null)
    const [reportData, setReportData] = useState<ReportType | null>(null)
    const [waitingInfo, setWaitingInfo] = useState<boolean>(false)
     
 
    //FETCH FUNCTION DATA
    useEffect(() => {      
        const fetchInitialData = async() => {
            const response = await fetchData({endpoint:`${auth.authData.organizationId}/reports/${reportId}`, getAccessTokenSilently, setWaiting:setWaitingInfo, setValue:setReportData, auth, setRef:reportDataRef})
        }
        fetchInitialData()
    }, [location])


    //SELECTED CHART
    const [selectedChart, setSelectedChart] = useState<ChartType | null>(null)
    useEffect(() => {setSelectedChart(null)},[location])
    const [waitingSave, setWaitingSave] = useState<boolean>(false)
    const saveChanges = async () => {
        const response = await fetchData({endpoint:`${auth.authData.organizationId}/reports/${reportData?.id}`, method:'put',getAccessTokenSilently, setWaiting:setWaitingSave, requestForm:reportData  as ReportType, auth, toastMessages:{works:t('CorrectSavedReport'), failed:t('FailedSavedReport')} })
          if (response?.status === 200) reportDataRef.current = reportData
    }

    //ACTION ON EXIT
    const [showNoSaveWarning, setShowNoSaveWarning] = useState<boolean>(false)
    const onExitAction = () => {
         if (JSON.stringify(reportData) !== JSON.stringify(reportDataRef.current)) setShowNoSaveWarning(true)
        else navigate('/stats')
    }   

 
    //SHOW DELETE BOX
    const [showDeleteBox, setShowDeleteBox] = useState<boolean>(false)
    const deleteReport= async () => {
        const response = await fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[2]}`, method:'delete',getAccessTokenSilently,  auth,  toastMessages:{works:t('CorrectDeletedReport'), failed:t('FailedDeletedReport')} })
        setShowDeleteBox(false)
        if (response?.status === 200) navigate('/stats')
    }
   
    

    const memoizedNoSavedWarning = useMemo(() => (<> 
        <ConfirmBox setShowBox={setShowNoSaveWarning} > 
            <Box p='20px' > 
                <Text fontWeight={'medium'}>{t('NoSavedChanges')}</Text>
                <Text mt={'.5vh'}>{t('NoSavedChangeAnswer')}</Text>
            </Box>
            <Flex p='20px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'border_color'}>
                <Button  size='sm' variant={'main'} onClick={() => {saveChanges();setShowNoSaveWarning(false);navigate('/stats')}}>{waitingSave?<LoadingIconButton/>:t('SaveAndExit')}</Button>
                <Button  size='sm'variant={'delete'} onClick={() => navigate('/stats')}>{t('NoSave')}</Button>
            </Flex>
        </ConfirmBox>    
    </>), [showNoSaveWarning])
    const memoizedActionsButton = useMemo(() => (<ActionsButton copyAction={() => {}} deleteAction={() => setShowDeleteBox(true)} />), [])
 
 
    return (<>      

    <ActionsBox showBox={showDeleteBox} setShowBox={setShowDeleteBox} type="delete" buttonTitle={t('DeleteReport')} title={t('DeleteReportName', {name:reportData?.name})} des={t('DeleteReportDes')} actionFunction={deleteReport} />
    {showNoSaveWarning && memoizedNoSavedWarning}

    {selectedChart ? <EditChartComponent chartData={selectedChart} setChartData={setSelectedChart} reportData={reportData as ReportType} setReportData={setReportData}/>:


    <Flex flexDir='column'bg='clear_white' height={'100vh'} width={`calc(100vw - ${sideBarWidth}px)`} position={'absolute'} right={0} overflowY={'hidden'}  transition={'width ease-in-out .2s'}>
       
        <Flex px='1vw' gap='2vw' height={'60px'} alignItems={'center'} justifyContent={'space-between'}  borderBottomWidth={'1px'} borderBottomColor={'border_color'}>
            <Flex flex={1} gap='10px' alignItems={'center'}> 
                 
                <Flex alignItems={'center'} flex='1'>
                    {isExpanded &&<RenderSectionPath sectionsPath={sectionsPath} sectionsPathMap={sectionsPathMap} selectedView={selectedView}/>}
                    <Skeleton isLoaded={reportData !== null && !waitingInfo} style={{flex:1, fontSize:'.8em'}}> 
                        <EditText placeholder={t('Name') + '...'} value={reportData?.name} setValue={(value) => setReportData(prev => ({...prev as ReportType, name:value})) } className="title-textarea"/>
                    </Skeleton>
                </Flex>
        
            </Flex>
            <Flex gap='10px' > 
                {memoizedActionsButton}
                <Button variant={'common'} size='sm' isDisabled={JSON.stringify(reportDataRef.current) === JSON.stringify(reportData)} onClick={saveChanges}>{waitingSave? <LoadingIconButton/>:t('SaveChanges')}</Button>
                <Button variant={'main'} leftIcon={<FaPlus/>} size='sm' onClick={() => setSelectedChart(newChart)}>{t('NewChart')}</Button>
            </Flex>
        </Flex>
   

        <Box flex='1' overflow={'scroll'}>
            {reportData?.charts.length === 0 ? 
                <Flex width={'100%'} height={'100%'}  justifyContent={'center'} alignItems={'center'}>
                    <Box textAlign={'center'} mt='-10vh'> 
                        <Text color={'text_gray'} fontSize={'2em'} fontWeight={'medium'} mb='10px'>{t('AddFirstChart')}</Text>
                        <Button size='lg' leftIcon={<FaPlus/>} variant={'main'} onClick={() => setSelectedChart(newChart)}>{t('AddChart')}</Button>
                    </Box>
                </Flex>
            :
            <Box  width={`calc(100vw - ${sideBarWidth}px)`}  >
                {reportData && <ChartGrid waitingInfo={waitingInfo} gridWidth={window.innerWidth - sideBarWidth} setSelectedChart={setSelectedChart} reportData={reportData} setReportData={setReportData}/>}
            </Box> 
            }
        </Box>
        
    
    </Flex>}
    </>)
}
 
export default Report
  
//EDIT CHART COMPONENT
const EditChartComponent = ({chartData, setChartData, reportData, setReportData}:{chartData:ChartType, reportData:ReportType, setChartData:Dispatch<SetStateAction<ChartType | null>>, setReportData:Dispatch<SetStateAction<ReportType | null>>}) => {
          
    //TRANSLATION
    const { getAccessTokenSilently } = useAuth0()
    const { t } = useTranslation('stats')
    const auth = useAuth()
    const location = useLocation().pathname

    //METRICS DEFINITION
    const defaultChartsConfig = {
        'KPI':{show_objective:false, objective_value:'0', show_unit:false, unit:''},
        'column':{is_stacked:false, show_percentage:false, show_legend:false},
        'bar':{is_stacked:false, show_percentage:false, show_legend:false},
        'donut':{donut_radius:false, show_percentage:false, show_legend:false},
        'area':{show_legend:false, show_percentage:false,},
        'line':{show_legend:false, show_percentage:false},
        'table':{show_acc_row:false}
    }
    const metricsDefinition:{[key in metrics]:{name:string, description:string, aggregation_type:('sum' | 'avg' | 'median' |  'count' | 'min' | 'max')[],allowed_partners:metrics[], allowed_filters:string[],allowed_view_by:string[],allowed_segment_by:string[]}} = {
        'total_conversations': {name:t('total_conversations'), description:t('total_conversationsDes'), aggregation_type:['count'],
            allowed_partners:['total_conversations','conversations_with_tilda_involvement', 'total_solved_conversations' ],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id','theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'average_response_time': {name:t('average_response_time'), description:t('average_response_timeDes'), aggregation_type:['avg','min','max'],
            allowed_partners:['average_response_time'],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id','theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'total_messages': {name:t('total_messages'), description:t('total_messagesDes'), aggregation_type:['sum', 'avg','min','max'],
            allowed_partners:['total_messages', 'tilda_messages_sent'],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'csat_score': {name:t('average_csat_score'), description:t('average_csat_scoreDes'), aggregation_type:['avg','count','min','max'],
            allowed_partners:['csat_score', 'nps_score'],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'nps_score': {name:t('average_nps_score'), description:t('average_nps_scoreDes'), aggregation_type:['avg','count','min','max'],
            allowed_partners:['csat_score', 'nps_score'],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id','theme_id','is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id',, 'is_transferred'] ,
        },
        'conversations_with_tilda_involvement': {name:t('conversations_with_tilda_involvement'), description:t('conversations_with_tilda_involvementDes'), aggregation_type:['count'],
            allowed_partners:['total_conversations','conversations_with_tilda_involvement', 'total_solved_conversations' ],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id','theme_id',, 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'tilda_messages_sent': {name:t('total_tilda_messages'), description:t('total_tilda_messagesDes'), aggregation_type:['avg','sum','min','max'],
            allowed_partners:['tilda_messages_sent', 'total_messages'],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:['time', 'channel_type', 'channel_id', 'user_id','theme_id', 'is_transferred'] ,
        },
        'tilda_words_sent': {name:t('total_tilda_words_sent'), description:t('total_tilda_words_sentDes'), aggregation_type:['avg','sum','min','max'],
            allowed_partners:['tilda_words_sent' ],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id','theme_id','is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
        'total_solved_conversations': {name:t('total_solved_conversations'), description:t('total_solved_conversationsDes'), aggregation_type:['count'],
            allowed_partners:['total_conversations','conversations_with_tilda_involvement', 'total_solved_conversations' ],
            allowed_filters:['created_at', 'updated_at', 'solved_at', 'closed_at', 'channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred', 'is_csat_opened', 'is_nps_offered'] ,
            allowed_view_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
            allowed_segment_by:[ 'time','channel_type', 'channel_id', 'user_id', 'theme_id', 'is_transferred'] ,
        },
    }
    const viewByDict = {'time':t('time'),'channel_type': t('channel_type'), 'theme_id': t('theme'), 'user_id': t('User'), 'channel_id':t('channel_id'), 'is_transferred':t('is_transferred')}

    //CONTAINER REF
    const containerRef = useRef<HTMLDivElement>(null)

    //CHART DATA
    const currentChartRef = useRef<ChartType>(chartData)
    const [currentChart, setCurrentChart] = useState<ChartType>(chartData)

    //SHOW CHART OPTIONS 
    const [chartSection, setChartSection] = useState<'data' | 'options'>('data')

    //SAVE CHANGES
    const [waitingSave, setWaitingSave] = useState<boolean>(false)
    const saveChanges = async () => {
        let response:any
        if (!chartData.id) {
            response =  await fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[3]}/charts`, method:'post', getAccessTokenSilently,setWaiting:setWaitingSave, requestForm:currentChart, auth, toastMessages:{works:t('CorrectCreatedChart'), failed:t('FailedCreatedChart')} }) 
            if (response?.status === 200) {
                setReportData(prev => ({...prev as ReportType, charts:[...(prev as ReportType)?.charts, {...currentChart, id:response?.data?.id as string}]}))
                setChartData(null)
            }
        }
        else response = response = await fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[3]}/charts/${currentChart.id}`, method:'put', getAccessTokenSilently,setWaiting:setWaitingSave, requestForm:currentChart, auth, toastMessages:{works:t('CorrectSavedChart'), failed:t('FailedSavedChart')} })
        if (response?.status === 200) {
            fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[2]}`, auth,getAccessTokenSilently, setValue:setReportData})
            currentChartRef.current = chartData
        }

    }

    //EDIT CHART DATA
    const isUpdatingRef = useRef(false)
    const editChartData = async () => {
        if (isUpdatingRef.current) return
        isUpdatingRef.current = true
        const response =  await fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[2]}/charts/compute`,getAccessTokenSilently, method:'post', setValue:setCurrentChart, requestForm:currentChart, auth})
        setTimeout(() => {isUpdatingRef.current = false}, 500)} 
    useEffect(() => {if (!isUpdatingRef.current) {editChartData()}}, [currentChart])
 
    //EDIT METRICS
    const addMetric = () => {
        const newMetric:MetricType = {id:'', report_chart_id: currentChart.id, aggregation_type:'count', metric_name: currentChart.metrics[currentChart.metrics.length - 1].metric_name,  legend_label: '', configurations: {}, filters:{logic:'AND', groups:[]}}
        setCurrentChart(prev => ({...prev, metrics:[...prev.metrics, newMetric]}))
    }
    
    //EDIT THE CONFIG FOR EACH CHART TYPE
    const editChartType = (type: 'KPI' | 'column' | 'bar' | 'donut' | 'line' | 'area' | 'table') => {
        const gridColumns = 6
        const grid = Array.from({ length: 40 }, () => Array(gridColumns).fill(0))

        reportData.charts.forEach(chart => {
            let x = chart.configuration.x
            let y = chart.configuration.y
            let w = chart.configuration.w
            let h = chart.configuration.h
            if (Object.keys(reportData.chart_positions).includes(chart.id)) {
                x = reportData.chart_positions[chart.id].x
                y = reportData.chart_positions[chart.id].y
                w = reportData.chart_positions[chart.id].w
                h = reportData.chart_positions[chart.id].h
            }
            else {
                x = chart.configuration.x
                y = chart.configuration.y
                h = chart.configuration.h
                w = chart.configuration.w
            }


            for (let row = y; row < y + h; row++) {
                for (let col = x; col < x + w; col++) {
                    if (row < grid.length && col < gridColumns) {
                        grid[row][col] = 1
                    }
                }
            }
        })


        const canPlaceChart = (x:number, y:number, w:number, h:number) => {
            for (let row = y; row < y + h; row++) {
                for (let col = x; col < x + w; col++) if (row >= grid.length || col >= gridColumns || grid[row][col] !== 0) return false
            }
            return true
        }
        const findPositionForChart = (w:number, h:number) => {
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x <= gridColumns - w; x++) {
                    if (canPlaceChart(x, y, w, h)) return { x, y }
                }
            }
            return null
        }
        let w = 2
        let h = 1
        switch (type) {
            case 'KPI':
                w = 2; h = 1
                break
            case 'column':
            case 'area':
            case 'line':
                w = 4; h = 3
                break
            case 'bar':
                w = 3; h = 4
                break
            case 'donut':
                w = 3; h = 3
                break
            case 'table':
                w = 4, h = 3
                break
        }
        const position = findPositionForChart(w, h)
        if (position) {
            const { x, y } = position
            setCurrentChart(prev => ({
                ...prev,
                type,
                configuration: { ...defaultChartsConfig[type], x, y, w, h },
                metrics: (type === 'KPI' || type === 'donut') ? [prev.metrics[0]] : prev.metrics,
                segment_by: (type === 'KPI' || type === 'donut') ? {type:null, configuration:{}}: prev.segment_by.type ? prev.segment_by:{type:null, configuration:{}},
            }))
        }
    }
     //SHOW DELETE BOX
     const [showDeleteBox, setShowDeleteBox] = useState<boolean>(false)

    //FUNCTION FOR CREATE A NEW BUSINESS
    const deleteChart= async () => {
        const response = await fetchData({endpoint:`${auth.authData.organizationId}/reports/${location.split('/')[2]}/charts/${chartData.id}`,getAccessTokenSilently, method:'delete',  auth})
        if (response?.status === 200) {
            setReportData(prevReportData => ({...prevReportData as ReportType,charts: (prevReportData as ReportType).charts.filter(chart => chart.id !== chartData.id)}))
            setChartData(null)
        }
    }

    
   
 
    const memoizedMetrics = useMemo(() => 
        currentChart.metrics.map((metric, index) => (
            <EditMetric key={`metric-${index}`} metric={metric} length={(currentChart?.metrics?.length || 0)}  index={index} setChartData={setCurrentChart} metricsDefinition={metricsDefinition} chartData={currentChart}  containerRef={containerRef}/>
        )),
        [currentChart.metrics]
    )
 return(<>
    <ActionsBox showBox={showDeleteBox} setShowBox={setShowDeleteBox} type="delete" buttonTitle={t('DeleteChart')} title={t('DeleteChartName', {name:chartData?.title})} des={t('DeleteChartDes')} actionFunction={deleteChart} />

    <Flex flexDir={'column'} w='100%' bg='white' h='100vh'> 
  
        <Flex height={'50px'} px='2vw' gap='32px' alignItems={'center'} justifyContent={'space-between'}> 
            <Box w='100%' mt='10px' maxW={'800px'}> 
                <EditText  placeholder={t('name')} value={currentChart?.title} setValue={(value) => setCurrentChart(prev => ({...prev, title:value}))} className={'title-textarea-collections'}/>
            </Box>
            <Flex gap='15px'> 
                <Button variant={'common'} size='sm' onClick={() => setChartData(null)}>{t('Close')}</Button>
                {chartData.id && <Button variant={'delete'} size='sm' onClick={() => setShowDeleteBox(true)}>{t('Delete')}</Button>}
                <Button variant={'main'} size='sm' isDisabled={JSON.stringify(currentChartRef.current) === JSON.stringify(currentChart)} onClick={saveChanges}>{waitingSave? <LoadingIconButton/>:t('SaveChanges')}</Button>
            </Flex>
        </Flex>
         
        <Flex height={'calc(100vh - 50px)'} >
            <Box flex='4'  p='1vw' bg='hver_gray' borderTopColor={'border_color'} borderTopWidth={'1px'} borderRightColor={'border_color'} borderRightWidth={'1px'}> 
                <SectionSelector onChange={(section) => editChartType(section) } selectedSection={currentChart.type}  sections={['KPI', 'column', 'bar', 'donut', 'line', 'area', 'table']} sectionsMap={{'KPI':[t('KPI'),<PiNumberCircleFiveFill size='16px'/>], 'column':[t('Column'),<FaChartColumn size='16px'/>], 'bar':[t('Bar'),<FaChartBar size='16px'/>], 'donut':[t('Donut'),<FaChartPie size='16px'/>], 'line':[t('Line'),<FaChartLine size='16px'/>], 'area':[t('Area'),<FaChartArea size='16px'/>], 'table':[t('Table'),<FaTable size='16px'/>]}}/>
                <Box mt='5vh' width={'100%'} height={(currentChart.type === 'column' || currentChart.type === 'donut' || currentChart.type === 'area' || currentChart.type === 'line') ? '400px': (currentChart.type === 'bar' || currentChart.type === 'table')?'600px':'200px'}> 
                    <ChartComponent chartData={currentChart}/>
                </Box>
            </Box>

            <Flex flexDir={'column'} flex='2'  height={'calc(100vh - 60px)'}   borderTopColor={'border_color'} borderTopWidth={'1px'}> 
                <Box  px='1vw' pt='1vw'> 
                <SectionSelector size="xs" onChange={(section) => setChartSection(section) } selectedSection={chartSection} sections={['data', 'options']} sectionsMap={{'data':[t('data'),<IoStatsChart size='16px'/>], 'options':[t('options'),<IoSettingsSharp size='16px'/>]}}/>
                </Box>
                <Box flex='1'  px='1vw' overflow={'scroll'}  pb='5vh' ref={containerRef}> 
                    {chartSection === 'data' ?
                        <Box  > 
                            <Flex mt='2vh' mb='.5vh'  alignItems={'center'} gap='15px'> 
                                <Text fontWeight={'semibold'} fontSize={'.9em'}>{t('TimeInterval')}</Text>
                                <SectionSelector size={'xxs'} selectedSection={currentChart.date_range_type} sectionsMap={{'fixed':[t('fixed'), <FaLock/>], 'relative':[t('relative'), <FaClockRotateLeft/>]}} sections={['relative', 'fixed']} onChange={(option) => setCurrentChart(prev => ({...prev, date_range_value:option === 'fixed'? initialRange:'Yesterday', date_range_type:option}))}/>
                            </Flex>
                            <Box w={'250px'} mt='1vh'>
                                {currentChart.date_range_type === 'relative' ? 
                                    <CustomSelect hide={false} options={['Today', 'Yesterday', 'Past 1 week', 'Past 1 month', 'Past 3 months', 'Past 6 months', 'Past 1 year']} selectedItem={currentChart.date_range_value} containerRef={containerRef} labelsMap={{'Today':t('Today'), 'Yesterday':t('Yesterday'), 'Past 1 week':t('PastWeek', {count:1}), 'Past 1 month':t('PastMonth', {count:1}), 'Past 3 months':t('PastMonth', {count:3}), 'Past 6 months':t('PastMonth', {count:6}), 'Past 1 year':t('PastYear', {count:1})}} setSelectedItem={(value) => setCurrentChart(prev => ({...prev, date_range_value:value as string}))}/>
                                :
                                    <DateRangePicker dateRangeString={currentChart.date_range_value} onDateChange={(range:string) => setCurrentChart(prev => ({...prev, date_range_value:range}))}/>
                                }
                            </Box>
                   
                            <Text mt='3vh' mb='.5vh' fontWeight={'semibold'} fontSize={'.9em'}>{t('Metrics')} ({currentChart.metrics.length})</Text>
                            {memoizedMetrics}
                            {(currentChart.type !== 'donut' && currentChart.type !== 'KPI' ) && <Button variant={'common'} size='xs' mt='2vh' leftIcon={<FaPlus/>} onClick={addMetric}>{t('AddMetric')}</Button>}
                            {currentChart.type !== 'KPI' && 
                                <> 
                                <Text mt='3vh' mb='.5vh' fontWeight={'semibold'} fontSize={'.9em'}>{t('ViewBy')}</Text>
                                <Box maxW={'350px'}>
                                    <CustomSelect hide={false} options={metricsDefinition[currentChart.metrics[0].metric_name].allowed_view_by} selectedItem={currentChart.view_by.type} containerRef={containerRef} labelsMap={viewByDict} setSelectedItem={(value:any) => setCurrentChart(prev => ({...prev, view_by:{configuration:value === 'time'?{granularity:'day'}:{}, type:value}}))}/>
                                </Box>
                                {currentChart.view_by.type === 'time' && 
                                    <Box mt='1vh'> 
                                        <SectionSelector size={'xxs'} selectedSection={currentChart.view_by.configuration.granularity} sectionsMap={{'hour':[t('hour'), <FaClock/>], 'day':[t('day'), <FaCalendarDay/>], 'week':[t('week'), <FaCalendarWeek/>], 'month':[t('month'), <FaCalendarDays/>]}} sections={['hour', 'day', 'week', 'month']} onChange={(option) => setCurrentChart(prev => ({...prev, view_by:{...prev.view_by, configuration:{granularity:option} }}))}/>
                                    </Box>
                                }
                                {currentChart.type !== 'donut' && <>
                                    <Text mt='3vh' mb='.5vh' fontWeight={'semibold'} fontSize={'.9em'}>{t('SegmentBy')}</Text>
                                    <Box maxW={'350px'}>
                                        <CustomSelect includeNull hide={false} options={[...metricsDefinition[currentChart.metrics[0].metric_name].allowed_segment_by]} selectedItem={currentChart.segment_by.type} containerRef={containerRef} labelsMap={viewByDict} setSelectedItem={(value:any) => setCurrentChart(prev => ({...prev, segment_by:{configuration:value === 'time'?{granularity:'day'}:{}, type:value}}))}/>
                                    </Box>
                                    {currentChart.segment_by.type === 'time' && 
                                        <Box mt='1vh'> 
                                            <SectionSelector size={'xs'} selectedSection={currentChart.segment_by.configuration.granularity} sectionsMap={{'hour':[t('hour'), <FaClock/>], 'day':[t('day'), <FaCalendarDay/>], 'week':[t('week'), <FaCalendarWeek/>], 'month':[t('month'), <FaCalendarDays/>]}} sections={['hour', 'day', 'week', 'month']} onChange={(option) => setCurrentChart(prev => ({...prev, segment_by:{...prev.segment_by, configuration:{granularity:option} }}))}/>
                                        </Box>
                                    }
                                </>}
                            </>}
                        </Box>
                    :
                    <Box px='5px'>
                        <EditChartStyles chartData={currentChart} setChartData={setCurrentChart}/>    
                    </Box>}
                </Box>
            </Flex>  

        </Flex>
    </Flex>
</>)
} 
 
//EDIT VARIABLES COMPONENTS
const EditStr = ({chartData, setChartData, keyToEdit,  title, description, placeholder}:{chartData:ChartType, setChartData:Dispatch<SetStateAction<ChartType>>, keyToEdit:string, title:string, description?:string, placeholder?:string,}) => {
        
    const [hoverDescription, setHoverDescription] = useState<boolean>(false)

    return (<> 
        <Flex  gap='5px'> 
            <Text fontWeight={'medium'} fontSize={'.9em'}>{title}</Text>
            {description && <Tooltip isOpen={hoverDescription} label={description} mt='-4px' placement='right' hasArrow bg='black_button'  borderRadius='.4rem'  fontSize='.7em' color='white' p='6px' >
                <Box onMouseEnter={() => setHoverDescription(true)} onMouseLeave={() => setHoverDescription(false)}> 
                    <Icon as={FaQuestionCircle} mt='3px' color='#222'  />
                </Box>
            </Tooltip>}
        </Flex>
        <Box width='300px' mt='.5vh'> 
            <EditText placeholder={placeholder} hideInput={false} value={chartData.configuration[keyToEdit] as string} setValue={(val) => setChartData(prev => ({...prev, configuration:{...prev.configuration,  [keyToEdit]:val}}))}/>
        </Box>
    </>)
}
const EditBool = ({chartData, setChartData, keyToEdit, title, description}:{chartData:ChartType, setChartData:Dispatch<SetStateAction<ChartType>>, keyToEdit:string, title:string, description?:string}) => {
    const [hoverDescription, setHoverDescription] = useState<boolean>(false)

    return (<>
      <Flex gap='8px' alignItems={'center'}>
            <Switch isChecked={chartData.configuration[keyToEdit] as boolean}  onChange={(e) => setChartData(prev => ({...prev, configuration:{...prev.configuration,  [keyToEdit]:e.target.checked}}))}/>
            <Flex mt='3px'  gap='5px'> 
                <Text fontWeight={'medium'} fontSize={'.9em'}>{title}</Text>
                {description && <Tooltip isOpen={hoverDescription} label={description} mt='-4px' placement='right' hasArrow bg='black_button'  borderRadius='.4rem' fontSize='.7em' color='white' p='6px' >
                    <Box onMouseEnter={() => setHoverDescription(true)} onMouseLeave={() => setHoverDescription(false)}> 
                        <Icon as={FaQuestionCircle} mt='3px' color='#222'  />
                    </Box>
                </Tooltip>}
            </Flex>
        </Flex>
    </>)
}
const EditInt = ({chartData, setChartData, keyToEdit,  title, description, max, min}:{chartData:ChartType, setChartData:Dispatch<SetStateAction<ChartType>>, keyToEdit:string, title:string, description?:string, max:number, min:number, }) => {
    const [hoverDescription, setHoverDescription] = useState<boolean>(false)

    return(<>
        <Flex  gap='5px'> 
            <Text fontWeight={'medium'} fontSize={'.9em'}>{title}</Text>
            {description && <Tooltip isOpen={hoverDescription} label={description} mt='-4px' placement='right' hasArrow bg='black_button'  borderRadius='.4rem' fontSize='.7em' color='white' p='6px' >
                <Box onMouseEnter={() => setHoverDescription(true)} onMouseLeave={() => setHoverDescription(false)}> 
                    <Icon as={FaQuestionCircle} mt='3px' color='#222'  />
                </Box>
            </Tooltip>}
        </Flex>
        <Flex  alignItems={'center'} fontWeight={'medium'} gap='10px'  maxW={'100px'}> 
            <NumberInput width={50 + max/10 * 15} size='sm' mt='.5vh' value={String(chartData.configuration[keyToEdit])} onChange={(val) => {if (parseInt(val) < 51) setChartData(prev => ({...prev, configuration:{...prev.configuration,  [keyToEdit]:val}}))}} min={min} max={max}>
                <NumberInputField  fontSize={'.9em'} borderRadius='.5rem'   borderColor={'border_color'} _hover={{ border: '1px solid #CBD5E0' }} _focus={{ borderColor: 'text_blue', borderWidth: '2px', px:'6px' }} px='7px' />
                    <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </Flex>
    </>)
}

//EDIT CHART STYLES
const EditChartStyles = ({chartData, setChartData}:{chartData:ChartType, setChartData:Dispatch<SetStateAction<ChartType>>}) => {
    
    const { t } = useTranslation('stats')

    switch (chartData.type) {
        case 'KPI':
            return (
                <Box mt='2vh'> 
                    <EditBool chartData={chartData} setChartData={setChartData} description={t('ShowObjectiveDes')} title={t('ShowObjective')} keyToEdit="show_objective" />
                    {chartData.configuration.show_objective && 
                        <Box mt='2vh'>
                            <EditInt  chartData={chartData} setChartData={setChartData}  title={t('Objective')} keyToEdit="objective_value" min={-1000000} max={100000}/>
                        </Box>}
                    <Box mt='2vh'> 
                        <EditBool  chartData={chartData} setChartData={setChartData}  description={t('ShowUnitDes')} title={t('ShowUnit')} keyToEdit="show_unit" />
                        {chartData.configuration.show_unit && 
                            <Box mt='2vh'>
                            <EditStr  chartData={chartData} setChartData={setChartData}   title={t('Unit')} keyToEdit="unit" />
                        </Box>}
                    </Box>
                </Box>
            )
        case 'column':
        case 'bar':
        case 'area':
        case 'line':
            return (
                <Box mt='2vh'> 
                    <EditInt chartData={chartData} setChartData={setChartData}  title={t('BorderRadius')} description={t('BorderRadiusDes')} keyToEdit="border_radius" min={0} max={50}/>


                    {(chartData.type !== 'line' && chartData.type !== 'area') && <>
                        <Box mt='2vh'>
                            <EditBool  chartData={chartData} setChartData={setChartData}  description={t('IsStackedDes')} title={t('IsStacked')} keyToEdit="is_stacked" />
                        </Box>   

                    </>}
                    <Box mt='2vh'>
                        <EditBool  chartData={chartData} setChartData={setChartData}  description={t('ShowPercentajeDes')} title={t('ShowPercentaje')} keyToEdit="show_percentage" />
                    </Box>   
                    <Box mt='2vh'>
                        <EditBool  chartData={chartData} setChartData={setChartData}  description={t('ShowLegendDes')} title={t('ShowLegend')} keyToEdit="show_legend" />
                    </Box>
                </Box>
                )
        case 'donut':
            return (
                <Box mt='2vh'>
                    <EditBool  chartData={chartData} setChartData={setChartData}  description={t('ShowLegendDes')} title={t('ShowLegend')} keyToEdit="show_legend" />
                    <Box mt='2vh' mb='2vh'>
                        <EditBool chartData={chartData} setChartData={setChartData}  description={t('ShowPercentajeDes')} title={t('ShowPercentaje')} keyToEdit="show_percentage" />
                    </Box>
                    <EditInt chartData={chartData} setChartData={setChartData}  title={t('DonutRadius')} keyToEdit="donut_radius" min={0} max={50}/>
                </Box>
                
            )
        case 'table':
            return (
                <Box mt='2vh'>
                    <EditBool  chartData={chartData} setChartData={setChartData}  description={t('ShowAccRowDes')} title={t('ShowAccRow')} keyToEdit="show_acc_row" />
                </Box>
            )
        
    }
}   

//EDIT METRICS
const EditMetric = ({metric, index, setChartData, metricsDefinition, chartData, containerRef, length}:{metric:MetricType, index:number,  setChartData:Dispatch<SetStateAction<ChartType>>, metricsDefinition:any, chartData:ChartType,containerRef:RefObject<HTMLDivElement>, length:number}) => {

    const { t } = useTranslation('stats')
    

    const editMetric = (type:'edit' | 'delete', newMetric?: MetricType) => {
        setChartData(prevChartData => {
            if (!prevChartData) return prevChartData
            const updatedMetrics = [...prevChartData.metrics]
            if (type === 'edit' && newMetric !== undefined && index !== undefined) updatedMetrics[index] = newMetric
            else if (type === 'delete' && index !== undefined) updatedMetrics.splice(index, 1)
            return { ...prevChartData, metrics: updatedMetrics }
        })
    }
    
    //SELECT A METRIC
    const SelectMetrics = () => {

        //REFS
        const buttonRef = useRef<HTMLDivElement>(null)
        const boxRef = useRef<HTMLDivElement>(null)
        const [showSearch, setShowSearch] = useState(false)
        const [text, setText] = useState<string>('')
        const [filterdMetricsList, setFilterdMetricsList] = useState<metrics[]>([])
    
        useEffect(() => {
            const filterUserData = () => {
                const filtered = Object.keys(metricsDefinition)?.filter(metric =>
                    metricsDefinition[metric as metrics].name.toLowerCase().includes(text.toLowerCase()) ||
                    metricsDefinition[metric as metrics].description.toLowerCase().includes(text.toLowerCase()) 
                )
                setFilterdMetricsList(filtered as metrics[])
            }
            filterUserData()
        }, [text])
     
    
        //BOOLEAN TO CONTROL THE VISIBILITY OF THE LIST AND CLOSE ON OUTSIDE CLICK
        const [boxStyle, setBoxStyle] = useState<CSSProperties>({})
        determineBoxStyle({buttonRef, setBoxStyle, changeVariable:showSearch})
        useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef, onOutsideClick:setShowSearch})
 
        return (
            <Box mt='2vh' position={'relative'}>
                <Flex bg={'white'}  cursor={'pointer'} alignItems={'center'} onClick={() => setShowSearch(!showSearch)} ref={buttonRef} height={'32px'} fontSize={'.9em'}  border={showSearch ? "3px solid rgb(59, 90, 246)":"1px solid transparent"} justifyContent={'space-between'} px={showSearch?'5px':'7px'} py={showSearch ? "5px" : "7px"} borderRadius='.5rem' _hover={{border:showSearch?'3px solid rgb(59, 90, 246)':'1px solid transparent'}}>
                    <Text fontWeight={'medium'} fontSize={'.9em'} >{metricsDefinition[metric.metric_name].name}</Text>
                    <Icon boxSize='14px' className={showSearch ? "rotate-icon-up" : "rotate-icon-down"} as={TiArrowSortedDown}/>
                </Flex>
                    {showSearch && 
                    <Portal>
                        <MotionBox initial={{ opacity: 0, marginTop:-10, marginBottom:-10 }} animate={{ opacity: 1, marginTop: 0,marginBottom:0 }}  exit={{ opacity: 0,marginTop:-10,marginBottom:-10}} transition={{ duration: '.2', ease: 'easeOut'}}
                            top={boxStyle.top} transform='translateY(37px)' bottom={boxStyle.bottom} right={boxStyle.right} width={boxStyle.width} maxH='40vh' overflow={'scroll'} gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'border_color'}>
                            <Box px='7px' py='3px'> 
                            <EditText fontSize={'.9em'} placeholder={t('Search') + '...'} focusOnOpen searchInput value={text} setValue={setText}/>
                            </Box>
                            <Box height={'1px'} width={'100%'} bg='border_color'/>
                                <Box maxH='30vh'>
                                    {filterdMetricsList.length === 0? 
                                    <Box p='15px'><Text fontSize={'.9em'} color='text_gray'>{t('NoCoincidence')}</Text></Box>
                                    :<>{filterdMetricsList.map((me, index) => {

                                        const isEnabled =  metricsDefinition[me].allowed_partners.includes(chartData.metrics[0].metric_name) || chartData.metrics.length === 1
                                        return (<Flex key={`filtered-metric-${index}`} color={isEnabled ?'black':'gray.500'} bg={isEnabled ? 'transparent':'gray_2'} _hover={{bg:isEnabled ?'gray.50':''}} cursor={isEnabled?'pointer':'not-allowed'} alignItems={'center'} onClick={() => {if (isEnabled) editMetric('edit',{ ...metric, metric_name: me, aggregation_type:metricsDefinition[me].aggregation_type[0] })}}  p='10px' gap='10px' >
                                            <Box> 
                                                <Text fontWeight={'medium'}>{metricsDefinition[me].name}</Text>
                                                <Text fontSize={'.9em'} color={isEnabled?'text_gray':'gray.400'}>{metricsDefinition[me].description}</Text>
                                            </Box>
                                        </Flex>)
                                        })}</>}
                                </Box>
                        </MotionBox>
                    </Portal>} 
            </Box>
        )
    }
    return (
        <Box bg='gray_2' mt='2vh' borderRadius={'.5rem'} p='15px'>
            <Flex mb='.5vh' gap='15px' justifyContent={'space-between'} > 
                <Box w='100%'> 
                    <EditText placeholder={t('LegendLabel') + '...'}value={metric.legend_label} setValue={(value => editMetric('edit', { ...metric, legend_label: value }))}  className={'description-textarea-functions-2'}/>
                </Box>
                {length !== 1 && <IconButton size='xs' variant={'delete'} onClick={() => editMetric('delete')} icon={<HiTrash/>} aria-label="delete-param"/>}
            </Flex>
             <SelectMetrics/>
            <Box mt='2vh'>
                {metricsDefinition[metric.metric_name].aggregation_type.length > 1 &&<> 
                    <Text fontWeight={'medium'} mb='.5vh'>{t('AggregationFunction')}</Text>
                    <Box width={'250px'}> 
                        <CustomSelect hide={false} selectedItem={metric.aggregation_type} labelsMap={{'sum':t('sum'), 'avg':t('average'), 'median':t('median'), 'count':t('count'), 'min':t('min'), 'max':t('max') }} setSelectedItem={(value) => editMetric('edit', {...metric, aggregation_type:value as any})} options={metricsDefinition[metric.metric_name].aggregation_type} />
                    </Box> 
                </>}
                <FilterManager filters={metric.filters} setFilters={(filters) => editMetric('edit', {...metric, filters})}  excludedFields={['contacts', 'contact_businesses']} scrollRef={containerRef} />
             </Box>
        </Box>
    )
}

//CHARTS GRID
const ChartGrid = ({ reportData, waitingInfo, setReportData, gridWidth, setSelectedChart }:{reportData:ReportType,  setReportData:Dispatch<SetStateAction<ReportType | null>>, waitingInfo:boolean, gridWidth:number, setSelectedChart:Dispatch<SetStateAction<ChartType | null>>}) => {

    const { t } = useTranslation('stats')
    const initialRender = useRef<boolean>(true)

    const [hoverStates, setHoverStates] = useState<any>(Array(reportData.charts.length).fill(false))


    const layoutData = reportData.charts.map((chart,index) => {
        let x = chart.configuration.x
        let y = chart.configuration.y
        let w = chart.configuration.w
        let h = chart.configuration.h
        if (Object.keys(reportData.chart_positions).includes(chart.id)) {
            x = reportData.chart_positions[chart.id].x
            y = reportData.chart_positions[chart.id].y
            w = reportData.chart_positions[chart.id].w
            h = reportData.chart_positions[chart.id].h
        }

        return {i:index, x, y, h,  w}
    })

     
    const handleLayoutChange = (layout:any[]) => {
        let newChartsPositions: { [key: string]: { x: number, y: number, w: number, h: number } } = {}
        layout.forEach(item => {
            const chartIndex = parseInt(item.i.split('-')[1], 10)
            newChartsPositions[reportData.charts[chartIndex].id] = {x:item.x, y:item.y, w: item.w, h: item.h}
        })
        if (!initialRender.current) setReportData(prev => ({...prev as ReportType, chart_positions:newChartsPositions}))
        else initialRender.current = false
    }

    const handleMouseEnter = (index:number) => {
        setHoverStates((prev:any) => {
            const newState = [...prev]
            newState[index] = true
            return newState
        });
    }

    const handleMouseLeave = (index:number) => {
        setHoverStates((prev:any) => {
            const newState = [...prev]
            newState[index] = false
            return newState
        })
    }

    return (
 
        <GridLayout draggableHandle=".drag-handle" resizeHandles={['se']} style={{overflow: 'visible'}} containerPadding={[window.innerWidth * 0.02, window.innerHeight * 0.02]}  onLayoutChange={handleLayoutChange}  margin={[window.innerHeight * 0.02, window.innerHeight * 0.02]} autoSize={true} className="layout" cols={6}   rowHeight={gridWidth/12} width={gridWidth}>
            {layoutData.map((chart, index) => {
                 return (
                    <Skeleton isLoaded={!waitingInfo}  key={`chart-${index}`} style={{position:'relative', borderWidth:'1px', borderColor:'#E2E8F0', borderRadius:'1rem', transition:'border-color .2s ease-in-out'}} data-grid={{ x: chart.x, y: chart.y, w: chart.w, h: chart.h}}    onMouseEnter={() => handleMouseEnter(index)} onMouseLeave={() => handleMouseLeave(index)}>
                         
                            <Flex px='20px' gap='10px' color='text_gray' pointerEvents={hoverStates[index] ? 'auto':'none'} opacity={hoverStates[index] ? 1:0} transition='opacity .2s ease-in-out' flexDir={'row-reverse'} position='absolute' w={'100%'}  top={'-10px'} height={'60px'}  >
                                <Tooltip hasArrow label={t('EditChart')} placement='top' color={'black'} bg='white' boxShadow={'0 0 10px 1px rgba(0, 0, 0, 0.15)'} borderWidth={'1px'} borderColor={'border_color'} borderRadius='.4rem' fontSize='.8em' fontWeight={'medium'} p='6px'>
                                    <Box  mt='23px' height={'25px'}> 
                                        <Icon onClick={(e) => {e.stopPropagation();setSelectedChart(reportData.charts[index])}} boxSize={'14px'} as={RiEditFill}  cursor={'pointer'}/>
                                    </Box>
                                </Tooltip>
                                <Tooltip hasArrow label={t('DragChart')} placement='top' color={'black'} bg='white' boxShadow={'0 0 10px 1px rgba(0, 0, 0, 0.15)'} borderWidth={'1px'} borderColor={'border_color'} borderRadius='.4rem' fontSize='.8em' fontWeight={'medium'} p='6px'>
                                    <Box className="drag-handle"  mt='20px' height={'25px'}> 
                                        <Icon boxSize={'20px'} transform={'rotate(90deg)'} as={MdOutlineDragIndicator}  cursor={'pointer'}/>
                                    </Box>
                                </Tooltip>
                         

                             
                            </Flex> 
                            <ChartComponent chartData={reportData.charts[index]}/>
                 
                    </Skeleton>
                )})}
 
 
        </GridLayout>

        )
}
  

 

 