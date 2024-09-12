//REACT
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../AuthContext.js'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from '../../API/fetchData.js'
//FRONT
import { NumberInput, NumberInputField, Flex, Box, Text, Icon } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//COMPONENTS
import EditText from './EditText.js'
import CustomSelect from './CustomSelect.js'
import LoadingIconButton from './LoadingIconButton.js'
//FUCNTIONS
import useOutsideClick from '../../Functions/clickOutside.js'
//ICONS
import { FaBuilding } from 'react-icons/fa'
import { IoIosArrowDown } from 'react-icons/io'
//TYPING
import { languagesFlags, ContactBusinessesTable} from '../../Constants/typing.js'
 

//MOTIOSN BOX
const MotionBox = motion(Box)

//FIND BUSINESS COMPONENT
const FindBusinessComponent = ({value, setValue, auth}:{value:number, setValue:any, auth:any}) => {

    //REFS
    const buttonRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const [showSearch, setShowSearch] = useState(false)
    
    const [text, setText] = useState<string>('')
    const [showResults, setShowResults] = useState<boolean>(false)
    const [elementsList, setElementsList] = useState<any>([])
    const [waitingResults, setWaitingResults] = useState<boolean>(false)

    //BOOLEAN TO CONTROL THE VISIBILITY OF THE LIST AND CLOSE ON OUTSIDE CLICK
    useOutsideClick({ref1:buttonRef, ref2:boxRef, onOutsideClick:setShowSearch})

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
            <Text>{value}</Text>
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
                            <Flex _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'} onClick={() => {setText('');setValue(business);setShowResults(false)}} key={`user-${index}`} p='10px' gap='10px' >
                                <Icon boxSize={'12px'} color='gray.700' as={FaBuilding}/>
                                <Text fontSize={'.9em'}>{business.name}</Text>
                            </Flex>
                        ))}</>}
                    </Box>
                </>:<Box p='15px'><Text fontSize={'.9em'} color='gray.600'>{waitingResults?<LoadingIconButton/>:'No hay ninguna coincidencia'}</Text></Box>}
            </MotionBox>} 
        </AnimatePresence>
        </Box>
    )
}

//SHOWING THE VALUE TYPE DEPENDING ON THE VATIABLE TO EDIT IN MOTHERSTRUCTURE
const VariableTypeChanger = ({inputType, value, setValue}:{inputType:string, value:any, setValue:(value:any) => void}) => {
    
    //USEFUL CONSTANTS
    const { t } = useTranslation('flows')
    const auth = useAuth()

    switch(inputType) {
        case 'user_id':
            {
                let usersDict:{[key:number]:string} = {}
                if (auth.authData.users) Object.keys(auth.authData?.users).map((key:any) => {if (auth?.authData?.users) usersDict[key] = auth?.authData?.users[key].name})
                usersDict[0] = t('NoAgent')
                usersDict[-1] = 'Matilda'
                return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(usersDict).map(key => parseInt(key))} labelsMap={usersDict} />)
            }
        case 'group_id':
            {
                //FALTA GROUPS
                let usersDict:{[key:number]:string} = {}
                if (auth.authData.users) Object.keys(auth.authData?.users).map((key:any) => {if (auth?.authData?.users) usersDict[key] = auth?.authData?.users[key].name})
                usersDict[0] = t('NoAgent')
                usersDict[-1] = 'Matilda'
                return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(usersDict).map(key => parseInt(key))} labelsMap={usersDict} />)
            }

        case 'channel_type':
            return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={['email', 'whatsapp', 'instagram', 'webchat', 'google_business', 'phone']} labelsMap={{'email':t('email'), 'whatsapp':t('whatsapp'), 'instagram':t('instagram'), 'webchat':t('webchat'), 'google_business':t('google_business'), 'phone':t('phone')}} />)
        case 'title':
        case 'tags':
        case 'name':
        case 'notes':
        case 'labels':
        case 'domain':
            return <EditText value={value} setValue={(value) => setValue(value) } hideInput={false} />
        case 'subject':
            let subjectsDict:{[key:number]:string} = {}
            if (auth.authData?.users) Object.keys(auth.authData?.users).map((key:any) => {if (auth?.authData?.users) subjectsDict[key] = auth?.authData?.users[key].name})
            return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(subjectsDict).map(key => parseInt(key))} labelsMap={subjectsDict} />)
        case 'urgency_rating':
            const ratingMapDic = {0:`${t('Priority_0')} (0)`, 1:`${t('Priority_1')} (1)`, 2:`${t('Priority_2')} (2)`, 3:`${t('Priority_3')} (3)`, 4:`${t('Priority_4')} (4)`}
            return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(ratingMapDic).map(key => parseInt(key))} labelsMap={ratingMapDic} />)
        case 'status':
            const statusMapDic = {'new':t('new'), 'open':t('open'), solved:t('solved'), 'pending':t('pending'), 'closed':t('closed')}
            return (<CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(statusMapDic).map(key => parseInt(key))} labelsMap={statusMapDic} />)
        case 'is_matilda_engaged':
        case 'unseen_changes':
        case 'is_satisfaction_offered':
            const boolDict = {"True":t('true'), "False":t('false')}
            return <CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value)}  options={Object.keys(boolDict)} labelsMap={boolDict}/>
        case 'contact_business_id': return <FindBusinessComponent value={value} setValue={setValue} auth={auth}/>
        case 'language': {
            let languagesMap:any = {}
            for (const key in languagesFlags) {
                if (languagesFlags.hasOwnProperty(key)) {
                    const values = languagesFlags[key]
                    languagesMap[key] = values[0]
                }
            }
            return <CustomSelect labelsMap={languagesMap} selectedItem={value}  setSelectedItem={(value) => setValue(value)} options={Object.keys(languagesMap)} hide={false} />
        }

        case 'rating': 
        case 'hours_since_created': 
        case 'hours_since_updated': 
            return (
                <NumberInput value={value} onChange={(value) => setValue(value)} min={1} max={1000000} clampValueOnBlur={false} >
                    <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                </NumberInput>)
        default: 
            return null

    }

} 

export default VariableTypeChanger