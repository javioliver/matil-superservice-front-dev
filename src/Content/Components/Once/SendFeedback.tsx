//REACT
import { Dispatch, SetStateAction, useState, ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
 //FRONT
import { Box, Text, Flex, Button, Textarea } from '@chakra-ui/react'


const SendFeedBack = ({setShowFeedback}:{setShowFeedback:Dispatch<SetStateAction<boolean>>}) => {

    const { t } = useTranslation('main')

    const [feedbackText, setFeedbackText] = useState<string>('')
    const feedBackChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setFeedbackText(event.target.value)           
    }

    const sendFeedback = () => {

    }
    return(<>
       <Box p='20px' maxW='60vw'>
            <Text fontSize={'1.2em'} fontWeight={'medium'}>{t('UsersFeedback')}</Text>    
            <Text mt='.5vh' fontSize={'0.9em'} color='gray.600'>{t('UsersFeedbackDes')}</Text>        
        </Box>
        <Box borderBottomColor={'gray.200'} borderTopColor={'gray.200'}  borderWidth={'1px 0 1px 0'}  p='20px' overflowY={'scroll'}> 
             <Textarea  maxLength={500}  minHeight={'200px'} placeholder={t('FeedbackPlaceholder')} maxH='300px' value={feedbackText} onChange={feedBackChange} p='8px'  resize={'none'} borderRadius='.5rem' rows={1} fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
        </Box>
        <Flex p='20px' flexDir={'row-reverse'} gap='15px' alignItems={'center'}> 
            <Button variant={'main'}  size='sm' onClick={sendFeedback}>{t('Send')}</Button>
            <Button  variant={'common'} size='sm' onClick={()=>setShowFeedback(false)}>{t('Cancel')}</Button>
        </Flex>

    </>)
}

export default SendFeedBack