/*
    MAKE THE STATUS SYMBOL
*/

//TRANSLATION
import { useTranslation } from 'react-i18next'
//FRONT
import { Box, Text } from '@chakra-ui/react'
//TYPING
import { statesMap } from '../Constants/typing'

//MAIN FUNCTION
const StateMap = ({state}:{state:'new' | 'open' |'solved' | 'pending' | 'closed'}) => {
   
    const { t } = useTranslation('tickets')
    
    return(
    <Box display="inline-flex" fontSize='.9em' borderColor={statesMap[state][1]} borderWidth={'1px'} py='1px' px='5px' fontWeight={'medium'} color='white'  bg={statesMap[state][0]} borderRadius={'.7rem'}> 
        <Text>{t(state)}</Text>
    </Box>
    )

}

export default StateMap