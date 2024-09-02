//REACT
import { useEffect, useRef, useState, useMemo } from "react"
import { useAuth } from "../../../../AuthContext"
import { useTranslation } from "react-i18next"
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Text, Box, Flex, Button, NumberInput, NumberInputField, Textarea, Skeleton } from "@chakra-ui/react"
//PYTHON CODE EDITOR
import CodeMirror from "@uiw/react-codemirror"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view";

//COMPONENTS
import LoadingIconButton from "../../../Components/LoadingIconButton"
import EditText from "../../../Components/EditText"
import ConfirmBox from "../../../Components/ConfirmBox"
import '../../../Components/styles.css'
//ICONS
import { FaPlus } from "react-icons/fa6"
 
interface TableFunctionType {
    uuid:string
    name:string
    description:string
}

interface FunctionType {
    name: string
    description: string
    actions: {}
    code: string
}

 
  
const Functions = () => {

    //CONSTANTS
    const { t } = useTranslation('settings')
    const auth = useAuth()
 
    //CREATE NEW FUNCTION OR EDITING ONE
    const [editFunctionDataIndex, setEditFunctionDataIndex] = useState<number | null>(null)

    //TICKETS DATA
    const [functionsData, setFunctionsData] = useState<TableFunctionType[] | null>(null)

    //FETCH NEW DATA WHEN THE VIEW CHANGE
    useEffect(() => {        
        document.title = `${t('Functions')} - ${auth.authData.organizationId} - Matil`
        const fetchInitialData = async() => {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/functions`, setValue:setFunctionsData, auth})
        }
        fetchInitialData()
    }, [])
   

    //BOX FOR ADDING, EDITING AND DELETE A FUNCTION
    const EditFunctionBox = ({index}:{index:number}) => {

        //TEXT REF
        const codeBoxRef = useRef<HTMLDivElement>(null)

        //NEW FIELD DATA
        const functionUuid = functionsData?.[index].uuid || ''

        const [newFunctionData, setNewFunctionData] = useState<FunctionType | null>(null)
    
        useEffect(() => {                    
            const fetchFunctionData = async() => {
                if (index === -1) setNewFunctionData({name:'', description:'', actions:{}, code:''})
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/functions/${functionUuid}`, setValue:setNewFunctionData, auth})
            }
            fetchFunctionData()
        }, [])
        

        //BOOLEAN FOR WAITIGN THE EDIT
        const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false) 
        const [waitingEdit, setWaitingEdit] = useState<boolean>(false)
        const [waitingDelete, setWaitingDelete] = useState<boolean>(false)

        //EDIT AND ADD NEW FUNCTION
        const handleEditFunctions = async() => {
            setWaitingEdit(true)
            if (index === -1 ) {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions`, setWaiting:setWaitingEdit, method:'post', requestForm:newFunctionData as FunctionType, auth, toastMessages:{'works':t('CorrectAddedFunction'), 'failed':t('FailedAddedFunction')}})
                if (response?.status == 200) setFunctionsData((prev) => ([...prev as TableFunctionType[], {uuid:'', name:newFunctionData?.name as string, description:newFunctionData?.description as string}]))
            }
            else {
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${functionUuid}`, setWaiting:setWaitingEdit, method:'put', auth, toastMessages:{'works':t('CorrectEditedFunction'), 'failed':t('FailedEditedFunction')}})
                if (response?.status == 200)  setFunctionsData((prev) => prev?.map((func) => func.uuid === functionUuid ? { ...func, name:newFunctionData?.name as string, description:newFunctionData?.description as string} : func) || [])
            }
            setEditFunctionDataIndex(null)          
        }
    
        const handleDeleteFunctions= async() => {
            setWaitingDelete(true)
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/functions/${functionUuid}`, method:'delete', auth, toastMessages:{'works':t('CorrectDeletedFunctions'), 'failed':t('FailedDeletedFunctions')}})
            if (response?.status == 200) setFunctionsData((prev) => (prev?.filter((func, index) => func.uuid === functionUuid) || [])) 
            setWaitingDelete(false)
        }

        const memoizedDeleteBox = useMemo(() => (
            <ConfirmBox setShowBox={setShowConfirmDelete} isSectionWithoutHeader={true}> 
                    <Box p='15px'> 
                        <Text width={'400px'}  fontWeight={'medium'}>{t('DeleteFunction')}</Text>
                    </Box>
                    <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                        <Button size='sm' color='red' _hover={{color:'red.600', bg:'gray.200'}} onClick={handleDeleteFunctions}>{waitingDelete?<LoadingIconButton/>:t('Delete')}</Button>
                        <Button size='sm' onClick={() => setShowConfirmDelete(false)}>{t('Cancel')}</Button>
                    </Flex>
                </ConfirmBox>
        ), [showConfirmDelete])
        
        const [height, setHeight] = useState<number>(0)
        useEffect(() => {setHeight((codeBoxRef.current?.getBoundingClientRect().height || 0) - 40)},[])

        //FRONT
        return(<>
            {showConfirmDelete && memoizedDeleteBox}

            <Flex   flexDir={'column'} height={'90vh'} justifyContent={'space-between'} > 

                <Flex flex='1' p='25px' justifyContent={'space-between'} flexDir={'column'}> 
                    <Box> 
                        <Text  mb='.5vh' fontWeight={'medium'}>{t('Name')}</Text>
                        <EditText  maxLength={100} placeholder={`${t('Name')}...`} hideInput={false} value={newFunctionData?.name} setValue={(value) => setNewFunctionData((prev) => ({...prev as FunctionType, name:value}))}/>
                        <Text  mt='1vh' mb='.5vh' fontWeight={'medium'}>{t('Description')}</Text>
                        <Textarea resize={'none'} maxLength={2000} height={'auto'} placeholder={`${t('DescriptionPlaceholder')}...`}  value={newFunctionData?.description} onChange={(e) => setNewFunctionData((prev) => ({...prev as FunctionType, description:e.target.value}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                    </Box>
                    <Box flex='1' > 
                        <Text  mt='1vh' mb='.5vh' fontWeight={'medium'}>{t('Code')}</Text>
                        <Box height={'100%'} ref={codeBoxRef}> 
                            <CodeMirror value={newFunctionData?.code} height="100%" maxHeight={`${height}px`} extensions={[python()]} onChange={(value) => setNewFunctionData((prev) => ({...prev as FunctionType, code:value}))} theme={oneDark}/>
                        </Box>
                    </Box> 
                </Flex>
                <Flex   p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                    <Button size='sm' color='white' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} isDisabled={newFunctionData?.name=== '' || newFunctionData?.code === ''} onClick={() => handleEditFunctions()}>{waitingEdit?<LoadingIconButton/>:index === -1 ?t('CreateFunction'):t('SaveChanges')}</Button>
                    <Button size='sm' onClick={() => setEditFunctionDataIndex(null)}>{t('Cancel')}</Button>
                </Flex>
             </Flex>

        </>)
    }   

 
    const memoizedEditFieldBox = useMemo(() => (
        <ConfirmBox setShowBox={() => setEditFunctionDataIndex(null)} isSectionWithoutHeader={true} max={true}> 
            <EditFunctionBox index={editFunctionDataIndex as number} />
        </ConfirmBox>
    ), [functionsData, editFunctionDataIndex])

   return(<>
     {editFunctionDataIndex && memoizedEditFieldBox}
 
    <Box height={'100%'} width={'100%'} overflow={'scroll'}> 

        <Flex justifyContent={'space-between'} alignItems={'end'}> 
            <Box> 
                <Text fontSize={'1.4em'} fontWeight={'medium'}>{t('Functions')}</Text>
                <Text color='gray.600' fontSize={'.9em'}>{t('FunctionsDes')}</Text>
            </Box>
            <Button  leftIcon={<FaPlus/>} onClick={() => setEditFunctionDataIndex(-1)}>{t('CreateFunction')}</Button>
        </Flex>
        <Box width='100%' bg='gray.300' height='1px' mt='2vh' mb='5vh'/>

        <Skeleton isLoaded={functionsData !== null}> 
            {functionsData?.length === 0 ? 
                <Box borderRadius={'.5rem'} width={'100%'} bg='gray.50' borderColor={'gray.200'} borderWidth={'1px'} p='15px'>    
                    <Text fontWeight={'medium'} fontSize={'1.1em'}>{t('NoFields')}</Text>
                </Box>: 
                <> 
                    <Flex  borderTopRadius={'.5rem'}  borderColor={'gray.300'} borderWidth={'1px'}  minWidth={'1180px'}  gap='20px' alignItems={'center'}  color='gray.500' p='10px'  bg='gray.100' fontWeight={'medium'} > 
                        <Text flex='20 0 200px'>{t('Id')}</Text>
                        <Text flex='25 0 250px'>{t('Name')}</Text>
                        <Text flex='20 0 200px'>{t('Description')}</Text>
                    </Flex>

                    {functionsData?.map((row, index) =>( 
                        <Flex minWidth={'1180px'} borderRadius={index === functionsData.length - 1?'0 0 .5rem .5rem':'0'} onClick={() => setEditFunctionDataIndex(index)} borderWidth={'0 1px 1px 1px'}  gap='20px' key={`field-${index}`}  alignItems={'center'}  fontSize={'.9em'} color='black' p='10px'  borderColor={'gray.300'}> 
                            <Text flex='25 0 250px'>{row.name}</Text>
                            <Text flex='30 0 300px'>{row.description}</Text>
                        </Flex>
                    ))}
                </>}
        </Skeleton>
    </Box>
    </>)
}

export default Functions