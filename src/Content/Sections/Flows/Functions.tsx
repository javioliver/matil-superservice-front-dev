//REACT
import { useEffect, useRef, useState, useMemo, Fragment } from "react"
import { useAuth } from "../../../AuthContext"
import { useTranslation } from "react-i18next"
import { useSession } from "../../../SessionContext"
import { useLocation, useNavigate } from "react-router-dom"
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { motion, isValidMotionProp, AnimatePresence } from 'framer-motion'
import { Text, Box, Flex, Button, Textarea, Skeleton, Tooltip, IconButton, NumberInput, NumberInputField, chakra, shouldForwardProp, Icon } from "@chakra-ui/react"
//PYTHON CODE EDITOR
import CodeMirror from "@uiw/react-codemirror"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
//COMPONENTS
import LoadingIconButton from "../../Components/Reusable/LoadingIconButton"
import EditText from "../../Components/Reusable/EditText"
import ConfirmBox from "../../Components/Reusable/ConfirmBox"
import CustomSelect from "../../Components/Reusable/CustomSelect"
import Table from "../../Components/Reusable/Table"
import '../../Components/styles.css'
//FUNCTIONS
import copyToClipboard from "../../Functions/copyTextToClipboard"
import useOutsideClick from "../../Functions/clickOutside"
import parseMessageToBold from "../../Functions/parseToBold"
//ICONS
import { FaPlus, FaPlay } from "react-icons/fa6"
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa"
import { IoIosArrowBack,IoIosArrowDown } from "react-icons/io"
import { IoWarning } from "react-icons/io5"
import { BsTrash3Fill, BsClipboard2Check } from "react-icons/bs"
import { RxCross2 } from "react-icons/rx"
//TYPING
import { FunctionsData } from "../../Constants/typing"
 
//TYPING
type variables = 'bool' | 'int' | 'float' | 'str' | 'timestamp'
interface FunctionType { 
    name: string
    description: string
    actions: {}
    arguments: {name: string, type: string, default: any}[]
    outputs: {name: string, type: string, default: any}[]
    code: string
    errors: {message: string, line: number, timestamp: string, arguments: {name: string, type: string, value: any}[]}[] 
  }
interface FunctionResultType {
    run_successful:boolean
    result:{outputs:{[key:string]:string}, motherstructure_updates:{[key:string]:string}, errors:{message: string, line: number, timestamp: string, arguments: {name: string, type: string, value: any}[]}[]}
    error_message:string 
    error_line:number
}
  
const CellStyle = ({ column, element }:{column:string, element:any}) => {
    return ( <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{element}</Text>)
}

//MOTION BOX
const MotionBox = chakra(motion.div, {shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop)})

//MAIN FUNCTION
const Functions = () => {

    //CONSTANTS
    const { t } = useTranslation('settings')
    const auth = useAuth()
    const session = useSession()
    const location = useLocation().pathname
    const functionsDataMap:{[key:string]:[string, number]} = {uuid:[t('Id'), 200], name:[t('name'), 200], description:[t('title'), 300], number_of_errors:[t('NumberErrors'), 140]} 

    //CREATE NEW FUNCTION OR EDITING ONE
    const [editFunctionUuid, setEditFunctionUuid] = useState<string | null>(location.split('/')[3]?location.split('/')[3] :null)

    //TICKETS DATA
    const [functionsData, setFunctionsData] = useState<FunctionsData[] | null>(null)

    //FILTER LOGIC
    const [text, setText]  =useState<string>('')
    const [filteredFunctions, setFilteredFunctions] = useState<FunctionsData[]>([])
    useEffect(() => {
    const filterUserData = () => {
        if (functionsData) {
            const filtered = functionsData.filter(flow =>
                flow.name.toLowerCase().includes(text.toLowerCase()) ||
                flow.description.toLowerCase().includes(text.toLowerCase()) || 
                flow.uuid.toLowerCase().includes(text.toLowerCase())
            )
            setFilteredFunctions(filtered)
        }
    }
    filterUserData()
    }, [text, functionsData])

    //FETCH NEW DATA WHEN THE VIEW CHANGE
    useEffect(() => {        
        document.title = `${t('Functions')} - ${auth.authData.organizationName} - Matil`
        const fetchInitialData = async() => {
            if (session.sessionData.flowsFunctions.functions) setFunctionsData(session.sessionData.flowsFunctions.functions)
            else {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions`, setValue:setFunctionsData, auth})
                if (response?.status === 200) session.dispatch({type:'UPDATE_FUNCTIONS',payload:{data:response?.data}})
            }
        }
        fetchInitialData()
    }, [])
    
    const onSaveFunction = async(action:'save' | 'go-back' | 'delete') => {
        if (action === 'go-back') setEditFunctionUuid(null)
        else {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions`, setValue:setFunctionsData, auth})
            if (action === 'delete') setEditFunctionUuid(null)
        }
    }

   return(<>
    
    {editFunctionUuid ?<EditFunctionBox selectedUuid={editFunctionUuid} onSaveFunction={onSaveFunction}/>: 
        <Box height={'100%'} width={'100%'} px='2vw'> 

            <Flex justifyContent={'space-between'} alignItems={'end'}> 
                <Box> 
                    <Text fontSize={'1.4em'} fontWeight={'medium'}>{t('Functions')}</Text>
                </Box>
                <Button size='sm' variant={'common'} leftIcon={<FaPlus/>} _hover={{color:'blue.400'}} onClick={() => setEditFunctionUuid('-1')}>{t('CreateFunction')}</Button>
            </Flex>

            <Box mt='2vh' width={'350px'}> 
                <EditText value={text} setValue={setText} searchInput={true}/>
            </Box>
        
            <Skeleton mt='2vh' isLoaded={functionsData !== null} >
                <Text fontWeight={'medium'} color='gray.600' fontSize={'1.2em'}>{t('functionsCount', {count:filteredFunctions?.length})}</Text> 
            </Skeleton>

            <Skeleton isLoaded={functionsData !== null}> 
                <Table data={filteredFunctions} CellStyle={CellStyle} noDataMessage={t('NoFunctions')} columnsMap={functionsDataMap} onClickRow={(value:any, index:number) => setEditFunctionUuid(value.uuid)}/>
            </Skeleton>
        </Box>
        }
    </>)
}

export default Functions


 //BOX FOR ADDING, EDITING AND DELETE A FUNCTION
const EditFunctionBox = ({selectedUuid, onSaveFunction}:{selectedUuid:string, onSaveFunction:(action:'save' | 'go-back' | 'delete') => void}) => {   

    //CONSTATNS
    const { t } = useTranslation('settings')
    const auth = useAuth()
    const location = useLocation().pathname
    const navigate = useNavigate()
    const variablesMap:{[key in variables]:string} = {'bool':t('bool'), 'int':t('int'), 'float':t('float'), 'str':t('str'), 'timestamp':t('timestamp')}
    const boolDict = {True:t('true'), False:t('false')}
    const datesMap = {'{today}':t('today'), '{yesterday}':t('yesterday'), '{start_of_week}':t('start_of_week'),'{start_of_month}':t('start_of_month')}
 
    //BUTTON REF
    const testButtonRef = useRef<HTMLButtonElement>(null)
    const errorButtonRef = useRef<HTMLButtonElement>(null)
    const errorBoxRef = useRef<HTMLDivElement>(null)
    const codeBoxRef = useRef<HTMLDivElement>(null) 
    const newFunction:FunctionType = {
        name:t('NewFunction'),
        description:'',
        actions:{},
        arguments:[],
        outputs:[],
        code:'',
        errors:[]
    }

    //SHOW NOT SAVED DATA WARNING
    const [showNoSaveWarning, setShowNoSaveWarning] = useState<boolean>(false)
    //SHOW TEST FUNCTION
    const [showTestFunction, setShowTestFunction] = useState<boolean>(false)

    //SHOW ERRORS
    const [showErrors, setShowErrros] = useState<boolean>(false)
    useOutsideClick({ref1:errorButtonRef, ref2:errorBoxRef, onOutsideClick:setShowErrros})

    //SHOW MORE INFO BOX
    const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false)

    //FUNCTION DATA
    const functionDataRef = useRef<FunctionType | null>(null)
    const [functionData, setFunctionData] = useState<FunctionType | null>(null)

    //FETCH FUNCTION DATA
    useEffect(() => {        
        const fetchInitialData = async() => {
            if (selectedUuid === '-1') setFunctionData(newFunction)
            else {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${selectedUuid}`, setValue:setFunctionData, auth})
                if (response?.status === 200) functionDataRef.current = response?.data
            }
        }
        fetchInitialData()
    }, [])

    //BOOLEAN FOR WAITIGN THE EDIT
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false) 
    const [waitingEdit, setWaitingEdit] = useState<boolean>(false)
    const [waitingDelete, setWaitingDelete] = useState<boolean>(false)

    //EDIT AND ADD NEW FUNCTION
    const handleEditFunctions = async() => {
        setWaitingEdit(true)
        const isNew = selectedUuid === '-1' 
        let response
        console.log(functionData)
        if (isNew) response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions`, setWaiting:setWaitingEdit, method:'post', requestForm:functionData as FunctionType, auth, toastMessages:{'works':t('CorrectAddedFunction'), 'failed':t('FailedAddedFunction')}})  
        else response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${selectedUuid}`, setWaiting:setWaitingEdit, method:'put', requestForm:functionData as FunctionType, auth, toastMessages:{'works':t('CorrectEditedFunction'), 'failed':t('FailedEditedFunction')}})

        if (response?.status == 200) onSaveFunction('save')          
    }

    //DELETE A FUNCTION
    const handleDeleteFunctions= async() => {
        setWaitingDelete(true)
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${selectedUuid}`, setWaiting:setWaitingDelete, method:'delete', auth, toastMessages:{'works':t('CorrectDeletedFunctions'), 'failed':t('FailedDeletedFunctions')}})
        if (response?.status == 200) onSaveFunction('delete')   
    }

    //EDIT FUNCTION DATA
    const editFunctionData = (keyToEdit:string ,value:any, type?:'add' | 'delete' | 'edit', index?:number, secondKey?:'name' | 'type' | 'default' ) => {
        console.log(typeof(value))
        setFunctionData(prev => {
            if (!prev) return prev
            const updatedFunction = { ...prev }
        
            if (type === 'add' || type === 'edit') {
                const listKey = keyToEdit as 'arguments' | 'outputs'
                const list = updatedFunction[listKey]
                if (index!== undefined && secondKey !== undefined && index >= 0 && index < list.length) list[index] = { ...list[index], [secondKey]: value }
                else if (type === 'add') list.push({name: '', type: 'bool', default: true})
                updatedFunction[listKey] = list
            } 
            else if (type === 'delete' && index !== undefined) {
              const listKey = keyToEdit as 'arguments' | 'outputs'
              const list = updatedFunction[listKey]
              if (index >= 0 && index < list.length) {
                list.splice(index, 1)
                updatedFunction[listKey] = list
              }
            } 
            else updatedFunction[keyToEdit as 'name' | 'description' | 'code'  ] = value
            
            return updatedFunction
          })
    }

    //BOX FOR CONFIRMING THE DELETION OF A FUNCTION
    const memoizedDeleteBox = useMemo(() => (
        <ConfirmBox setShowBox={setShowConfirmDelete} isSectionWithoutHeader={true}> 
                <Box p='15px'> 
                    <Text fontSize={'1.2em'}   fontWeight={'medium'}>{t('DeleteFunction')}</Text>
                    <Box height={'1px'} width={'100%'} bg='gray.300' mt='1vh' mb='1vh'/>
                    <Text>{parseMessageToBold(t('DeleteFunctionAnswer', {name:functionData?.name}))}</Text>
                </Box>
                 
                <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                    <Button size='sm' variant={'delete'}onClick={handleDeleteFunctions}>{waitingDelete?<LoadingIconButton/>:t('Delete')}</Button>
                    <Button  size='sm' variant={'common'} onClick={() => setShowConfirmDelete(false)}>{t('Cancel')}</Button>
                </Flex>
            </ConfirmBox>
    ), [showConfirmDelete])

    const TestFunction = () => {

        //WAITNG FUNCTION EXECUTION AND RESPONSE
        const [waitingTest, setWaitingTest] = useState<boolean>(false)

        //SELCETED ARGS
        const [selectedArgs, setSelectedArgs] = useState<{name: string, type: string, default: any}[]>(functionData?.arguments || [])

        //FUNCTION TESTED
        const [functionResult, setFunctionResult] = useState<FunctionResultType | null>(null)

        //EDIT FUNCTION ARGS
        const editSelectedArgs = (value:any, index:number) => {
            setSelectedArgs(prev => {
                const updatedArgs = [...prev]
                updatedArgs[index] = {...updatedArgs[index], default:value}
                return updatedArgs
            }) 
        }

        //SEND A FUNCTION TO TEST
        const testFunction = async () => {
            const requestDict = selectedArgs.reduce((acc: Record<string, any>, curr) => {
                acc[curr.name] = curr.default
                return acc  
            }, {} as Record<string, any>)
        
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${selectedUuid}/run`, method:'post', setWaiting:setWaitingTest, setValue:setFunctionResult,  auth, requestForm:requestDict})
            if (response?.status === 200) {
                console.log(response.data)
                setFunctionData(prev => ({...prev as FunctionType, errors: response.data.result.errors}))
            }
        }

        const memoizedFunctionResult = useMemo(() => (<> 
            {functionResult && 
                <ConfirmBox  setShowBox={setShowTestFunction} isSectionWithoutHeader={true}> 
                    <Box p='15px'> 
                        <Text fontSize={'1.2em'}   fontWeight={'medium'}>{t('FunctionResult')}</Text>
                        <Box height={'1px'} width={'100%'} bg='gray.300' mt='1vh' mb='1vh'/>
                        {functionResult.run_successful ? <>
                            <Flex gap='10px' alignItems={'center'} mb='1vh'> 
                                <Icon as={FaCheckCircle} color={'green'}/>
                                <Text fontWeight={'medium'}>{t('RunSuccessefully')}</Text>
                            </Flex>
                            <Text fontWeight={'medium'}>{t('OutputsReturned')}</Text>
                            {Object.keys(functionResult.result.outputs).map((out:string, index:number) => (
                                <Text fontSize={'.8em'} mt='.5vh' key={`run-output-${index}`}><span style={{fontWeight:500}}>{out}:</span> {functionResult.result.outputs[out]}</Text>
                            ))}
                         
                        </>:<> 
                        <Flex gap='10px' alignItems={'center'} mb='1vh'> 
                            <Icon as={FaTimesCircle} color={'red'}/>
                            <Text>{t('RunError')}</Text>
                        </Flex>
                        <Text color='red' fontSize={'.8em'}>{functionResult.error_message}</Text>
                        <Text fontSize={'.8em'} mt='.5vh' color='red'>[{t('ErrorLine', {line:functionResult.error_line})}]</Text>
                        </>}
                    </Box>
                 
                    <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                        <Button size='sm' variant={'common'} onClick={() => setShowTestFunction(false)}>{t('Accept')}</Button>
                    </Flex>
                </ConfirmBox>
                }
            </>), [functionResult])
            
        return (<> 
            {memoizedFunctionResult}
            <Box p='20px'> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>{t('SelectFunctionArgs')}</Text>
                <Text color='gray.600' fontSize={'.9em'}>{t('SelectFunctionArgsDes')}</Text>

                <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>

                {selectedArgs.map((arg, index) => (<Fragment key={`arg-${index}`}>
                    <Text fontWeight={'medium'} mt='1vh' mb='.5vh'>{arg.name}</Text>
                    <Box flex='2'>
                        {(() => {switch(arg.type) {
                            case 'bool':
                                return <CustomSelect hide={false} selectedItem={arg.default} setSelectedItem={(value) => editSelectedArgs(value, index)}  options={Object.keys(boolDict)} labelsMap={boolDict}/>
                            case 'int':
                            case 'float': return (
                                <NumberInput value={arg.default || undefined} onChange={(value) => editSelectedArgs(value, index)} clampValueOnBlur={false} >
                                    <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                                </NumberInput>)              
                            case 'str':
                                    return <EditText placeholder={`${arg.name}...`} value={arg.default || undefined} setValue={(value) => editSelectedArgs(value, index)} hideInput={false} />
                            case 'timestamp':
                                return <CustomSelect hide={false} selectedItem={arg.default}  setSelectedItem={(value) => editSelectedArgs(value, index)}  options={Object.keys(datesMap)} labelsMap={datesMap}/>
                        }})()}                                   
                        </Box>
                </Fragment>))}
            </Box>
            <Flex p='20px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                <Button  size='sm' variant={'main'} onClick={testFunction}>{waitingTest?<LoadingIconButton/>:t('Test')}</Button>
                <Button size='sm'  variant={'common'} onClick={() => setShowConfirmDelete(false)}>{t('Cancel')}</Button>
            </Flex>
        </>)
    }
   
    //ACTION ON EXIT
    const onExitAction = () => {
        if (JSON.stringify(functionData) !== JSON.stringify(functionDataRef.current)) setShowNoSaveWarning(true)
        else {
            if (location.split('/')[3]) navigate(`/flows-functions/flows/flow/${location.split('/')[4]}`)
            else onSaveFunction('go-back')
        }
    }   
    const memoizedNoSavedWarning = useMemo(() => (<> 
        {showNoSaveWarning && 
                <ConfirmBox setShowBox={setShowNoSaveWarning} isSectionWithoutHeader> 
                    <Box p='15px' > 
                        <Text fontWeight={'medium'}>{t('NoSavedChanges')}</Text>
                        <Text mt={'.5vh'}>{t('NoSavedChangeAnswer')}</Text>
                    </Box>
                    <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                        <Button  size='sm' variant={'main'} onClick={() => {handleEditFunctions();if (location.split('/')[3]) navigate(`/flows-functions/flows/flow/${location.split('/')[4]}`);else onSaveFunction('go-back')}}>{waitingEdit?<LoadingIconButton/>:t('SaveAndExit')}</Button>
                        <Button  size='sm'variant={'delete'} onClick={() => navigate('/flows-functions/flows')}>{t('NoSave')}</Button>
                    </Flex>
                </ConfirmBox>
            }
        </>), [showNoSaveWarning])

    //MEMOIZED TEST BOX COMPONENT
    const memoizedTestFunction = useMemo(() => (<> 
        {showTestFunction && 
            <ConfirmBox  setShowBox={setShowTestFunction} isSectionWithoutHeader={true}> 
                <TestFunction/>
            </ConfirmBox>
            }
        </>), [showTestFunction])


    const codeBoxHeight =  (window.innerHeight - window.innerWidth * 0.02) - (testButtonRef.current?.getBoundingClientRect().bottom || 1000 )
    
    //FRONT
    return(<>
        {memoizedNoSavedWarning}
        {showConfirmDelete && memoizedDeleteBox}
        <Skeleton width={'calc(100vw - 55px)'} position='fixed' height={'100vh'} top={0} left={0} zIndex={50} p='2vw' isLoaded={functionData !== null}> 
            <Box  bg='white' width={'100%'} height={'100%'}> 

                <Box minW={'500px'}  p='10px' left={'2vw'}  top='2vw' zIndex={100} position={'absolute'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} maxH={'calc(100vh - 10vw)'} overflow={'scroll'} bg='white' borderRadius={'.5rem'}  > 
                    <Flex flex={1} gap='20px' alignItems={'center'}> 
                        <Tooltip label={'Atrás'}  placement='bottom' hasArrow bg='black'  color='white'  borderRadius='.4rem' fontSize='.75em' p='4px'> 
                            <IconButton aria-label='go-back' size='sm' bg='transparent' border='none' onClick={onExitAction} icon={<IoIosArrowBack size='20px'/>}/>
                        </Tooltip>
                        <Box flex={1}> 
                            <EditText nameInput={true} size='md' value={functionData?.name} setValue={(value) => setFunctionData(prev => ({...prev as FunctionType, name:value}))}/>
                        </Box>
                        <Button leftIcon={<IoIosArrowDown className={!showMoreInfo ? "rotate-icon-up" : "rotate-icon-down"}/>} _hover={{bg:'brand.gray_1', color:'blue.400'}} size='sm' bg='transparent' borderColor={'transparent'} borderWidth={'1px'} onClick={() => setShowMoreInfo(!showMoreInfo)}>{t('SeeMoreData')}</Button>
                    </Flex>

                    {showMoreInfo && 
                        <Box p='15px'>
                            <Text  mt='3vh' mb='.5vh' fontWeight={'medium'}>{t('Description')}</Text>
                            <Textarea maxW={'1000px'} resize={'none'} maxLength={2000} height={'auto'} placeholder={`${t('DescriptionPlaceholder')}...`}  value={functionData?.description} onChange={(e) => setFunctionData(prev => ({...prev as FunctionType, description:e.target.value}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                        </Box>}
                </Box>

                <Box flex='1' > 
                    <Flex  gap='2vw' justifyContent={'space-between'} flexDir={'row-reverse'} alignItems={'center'}>     
                        <Flex gap='20px'> 
                            {selectedUuid !== '-1' && <Button size='sm'  variant={'common'} color='red' _hover={{color:'red.600'}} leftIcon={<BsTrash3Fill/>} onClick={() => setShowConfirmDelete(true)}>{t('DeleteFunction')}</Button>}
                            <Button  size='sm' variant={'common'} isDisabled={functionData?.name=== '' || functionData?.code === '' || (JSON.stringify(functionDataRef.current) === JSON.stringify(functionData))} onClick={handleEditFunctions}>{waitingEdit?<LoadingIconButton/>:t('SaveChanges')}</Button>
                         </Flex>
                    </Flex>

                    <Flex gap='2vw' mt='6vh'>    
                        
                        <Box  width='60%'> 
                            <Flex justifyContent={'space-between'} alignItems={'center'}> 
                                <Text  mb='.5vh' fontWeight={'medium'}>{t('Code')}</Text>
                                <Button leftIcon={<FaPlay/>} ref={testButtonRef} size='sm' onClick={() => setShowTestFunction(true)} variant={'main'}> {t('Test')}</Button>
                            </Flex>
                            <Box  mt='1vh' width='100%' height={'100%'} ref={codeBoxRef}> 
                                <CodeMirror value={functionData?.code} maxHeight={`${codeBoxHeight}px`} extensions={[python()]} onChange={(value) => setFunctionData(prev => ({...prev as FunctionType, code:value}))} theme={oneDark}/>
                            </Box>
                        </Box>
                        <Box flex='1'> 
                           
                            <Text  mb='.5vh' fontWeight={'medium'}>{t('Arguments')}</Text>
                            {functionData?.arguments.map((arg, index) => (
                                <Flex mt='.5vh'  key={`argument-${index}`} alignItems='center' gap='10px'>
                                    <Box flex='2'> 
                                        <EditText hideInput={false} value={arg.name} setValue={(value) => editFunctionData('arguments', value, 'edit', index, 'name')}/>
                                    </Box>
                                    <Box flex='1'>
                                        <CustomSelect hide={false} selectedItem={arg.type} setSelectedItem={(value) => editFunctionData('arguments', value, 'edit', index, 'type')} options={Object.keys(variablesMap)} labelsMap={variablesMap}/>
                                    </Box>
                                    <Box flex='2'>
                                        {(() => {switch(arg.type) {
                                            case 'bool':
                                                return <CustomSelect hide={false} selectedItem={arg.default} setSelectedItem={(value) => editFunctionData('arguments', value === 'true'?true:false, 'edit', index, 'default')}  options={Object.keys(boolDict)} labelsMap={boolDict}/>
                                            case 'int':
                                            case 'float': return (
                                                <NumberInput value={arg.default || undefined} onChange={(value) => editFunctionData('arguments', value, 'edit', index, 'default')}  clampValueOnBlur={false} >
                                                    <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                                                </NumberInput>)              
                                            case 'str':
                                                    return <EditText value={arg.default || undefined} setValue={(value) => editFunctionData('arguments', value, 'edit', index, 'default')} hideInput={false} />
                                            case 'timestamp':
                                                return <CustomSelect hide={false} selectedItem={arg.default}  setSelectedItem={(value) => editFunctionData('arguments', value, 'edit', index, 'default')}  options={Object.keys(datesMap)} labelsMap={datesMap}/>
                                        }})()}                                   
                                    </Box>
                                <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => editFunctionData('arguments', '', 'delete', index)}/>
                            </Flex>
                            ))}
                            <Button variant={'common'} size='xs' mt='2vh' leftIcon={<FaPlus/>}  onClick={() => editFunctionData('arguments', '', 'add')}>{t('AddArgument')}</Button>
                        
                            
                            <Text mt='3vh' mb='.5vh' fontWeight={'medium'}>{t('Outputs')}</Text>
                            {functionData?.outputs.map((arg, index) => (
                                <Flex mt='.5vh'  key={`output-${index}`} alignItems='center' gap='10px'>
                                <Box flex='2'> 
                                    <EditText hideInput={false} value={arg.name} setValue={(value) => editFunctionData('outputs', value, 'edit', index, 'name')}/>
                                </Box>
                                <Box flex='1'>
                                        <CustomSelect hide={false} selectedItem={arg.type} setSelectedItem={(value) => editFunctionData('outputs', value, 'edit', index, 'type')} options={Object.keys(variablesMap)} labelsMap={variablesMap}/>
                                </Box>
                                <Box flex='2'>
                                    {(() => {switch(arg.type) {
                                        case 'bool':
                                            return <CustomSelect hide={false} selectedItem={arg.default} setSelectedItem={(value) => editFunctionData('outputs', value, 'edit', index, 'default')}  options={Object.keys(boolDict)} labelsMap={boolDict}/>
                                        case 'int':
                                        case 'float': return (
                                            <NumberInput value={arg.default || undefined} onChange={(value) => editFunctionData('outputs', value, 'edit', index, 'default')}  clampValueOnBlur={false} >
                                                <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                                            </NumberInput>)              
                                        case 'str':
                                                return <EditText value={arg.default || undefined} setValue={(value) => editFunctionData('outputs', value, 'edit', index, 'default')} hideInput={false} />
                                        case 'timestamp':
                                            return <CustomSelect hide={false} selectedItem={arg.default}  setSelectedItem={(value) => editFunctionData('outputs', value, 'edit', index, 'default')}  options={Object.keys(datesMap)} labelsMap={datesMap}/>
                                    }})()}                                   
                                    </Box>
                                <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => editFunctionData('outputs', '', 'delete', index)}/>
                            </Flex>
                            ))}
                            <Button variant={'common'} size='xs' mt='2vh' leftIcon={<FaPlus/>}  onClick={() => editFunctionData('outputs', '', 'add')}>{t('AddOutput')}</Button>

                        </Box>
                        

                    </Flex>    
                
                </Box>       
            </Box>
        </Skeleton>
        
        {(functionData?.errors?.length || 0) > 0 &&
            <Box position={'absolute'} right={'2vw'} bottom={'2vw'}  > 
                <Box position='relative'> 
                    {!showErrors && <Button  shadow='xl' ref={errorButtonRef} bg="red.500" leftIcon={<IoWarning/>} color='white' _hover={{ bg:'red.600'}} onClick={() => setShowErrros(true)}>{t('ErrorsCount', {count:functionData?.errors.length})}</Button>}
                    
                    <AnimatePresence> 
                        {showErrors && 
                        <MotionBox initial={{ opacity: 0, marginBottom:-10 }} animate={{ opacity: 1, marginBottom: 0}}  exit={{ opacity: 0,bottom: -10}} transition={{ duration: '.2', ease: 'easeOut'}}
                            right={'2vw'} width={'700px'} maxWidth={'40vw'}  bottom={'2vw'} maxH='80vh' gap='10px' boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000}   position={'fixed'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                            <Flex p='15px' justifyContent={'space-between'}> 
                                <Text fontSize={'1.1em'} fontWeight={'medium'}>{t('Errors')}</Text>
                                <IconButton isRound bg='transparent' size='sm' onClick={()=>setShowErrros(false)} aria-label="show-client" icon={<IoIosArrowDown size={'16px'}/>}/>
                            </Flex>

                            {functionData?.errors.map((error, index) => (
                                <Flex bg={index % 2 === 0?'gray.100':'gray.50'} p='15px' alignItems={'center'} key={`error-${index}`} justifyContent={'space-between'} gap='10px'>
                                    <Box flex='1' gap='30px' >
                                        <Flex gap='10px'> 
                                            <Text textOverflow={'ellipsis'} fontSize={'.9em'} whiteSpace={'nowrap'} fontWeight={'medium'}>{error.timestamp}</Text>
                                            <Box fontSize={'.8em'}> 
                                                <Text>{error.message}</Text>
                                                <Text color='red'>[{t('ErrorLine', {line:error.line})}] {Object.keys(error.arguments).map((arg, argIndex) => (<span>{t('ErrorArgument', {name:arg, value:error.arguments[arg as any]})}{argIndex === error.arguments.length - 1 ?'':', '}</span>))} </Text>
                                            </Box>
                                        </Flex>
                                    </Box>        
                                    <Tooltip label={t('CopyError')}  placement='top' hasArrow bg='black' color='white'  borderRadius='.4rem' fontSize='sm' p='6px'> 
                                        <IconButton size='xs' onClick={() => copyToClipboard(error.message)}  aria-label={'copy-invitation-code'} icon={<BsClipboard2Check/>}/>
                                    </Tooltip>
                                </Flex>
                            ))} 
                        </MotionBox>}
                    </AnimatePresence>
                </Box>
            </Box>}

        {memoizedTestFunction}
 
    </>)
}  
