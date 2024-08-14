//REACT
import { Dispatch, SetStateAction , useState} from 'react'
import { useTranslation } from 'react-i18next'
//FRONT
import { Flex, Icon, Box, Text, Checkbox, Grid, Button } from '@chakra-ui/react'
import { Handle, Position } from 'reactflow'
//ICONS
import { IoMdChatbubbles } from "react-icons/io"
import { FaCodeBranch } from "react-icons/fa6"
import { IconType } from 'react-icons'
//TYPING
import { logosMap, Channels, actionTypesDefinition, Branch } from '../../Constants/typing.js'



//FIRST NODE DATA
interface TriggerNodeData {
  channels:Channels[]
  setChannels:Dispatch<SetStateAction<Channels[]>>
}
  
//BRANCHER NODE DATA
interface BrancherNodeData {
  branches:Branch[]
  setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
  editBranch:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add') => void
}

//EXTRACTOR NODE DATA
type Message = {
  'type': 'generative' | 'preespecified',
  'generation_instructions': string | null,
  'preespecified_messages':{[key: string]: string} | null
}
interface ExtractorNodeData {
  variables:{index:number, message:Message}[]
  branches:Branch[]
  setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
 }

//FIRST NODE
export const FirstNode = ({data}:{data:TriggerNodeData}) => {
  
  //TRANSLATION
  const { t } = useTranslation('flows')

  const ChannelComponent = ({channel}:{channel:Channels}) => {
    const handleCheckboxChange = (channel: Channels) => {
      let newChannels
      if (data.channels.includes(channel)) newChannels = data.channels.filter(c => c !== channel)
      else newChannels = [...data.channels, channel]
      data.setChannels(newChannels)
    }
    return(
    <Flex alignItems={'center'} gap='10px'>
      <Checkbox  isChecked={data.channels.includes(channel)} onChange={() => handleCheckboxChange(channel)}/>
      <Flex fontSize={'.7em'} alignItems={'center'} gap='5px'>
        <Icon as={logosMap[channel][0]}/>
        <Text whiteSpace={'nowrap'}>{t(channel)}</Text> 
      </Flex>      
    </Flex>)
  }
  
  return (
    <Box bg="gray.50" borderRadius={'.5rem'} borderColor='blue.100' borderWidth={'2px'} p='15px' >
        <Flex gap='20px' alignItems={'center'}> 
          <Flex justifyContent={'center'} bg='blue.400' alignItems={'center'} p='10px' borderRadius={'full'}> 
            <Icon color='white' boxSize={'20px'} as={IoMdChatbubbles}/>
          </Flex>
          <Text fontWeight={'medium'}>{t('FirstNode')}</Text>
        </Flex>
        <Box width={'100%'} height={'1px'} mt='20px' mb='20px' bg='gray.300'/>
        <Text fontSize={'.8em'} fontWeight={'medium'} color='gray.600'>{t('Channels')}</Text>
        <Grid mt='10px' templateColumns="repeat(2, 0fr)"  columnGap="30px" rowGap="10px">
          {Object.keys(logosMap).map((channel, index) => (
            <ChannelComponent channel={channel as Channels} key={`channel-${index}`}/>
          ))}
        </Grid>
    </Box>
  )
}

//BRANCHER NODE
export const BrancherNode = ({id, data}:{id:string, data:BrancherNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  return (

    <Box bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} p='15px' width='250px'>
      <Flex gap='15px' alignItems={'center'}  > 
        <Flex justifyContent={'center'} bg='yellow.400' alignItems={'center'} transform={'rotate(45deg)'} p='7px' borderRadius={'.5rem'}> 
          <Icon color='white' boxSize={'15px'} as={FaCodeBranch} transform={'rotate(45deg)'}/>
        </Flex>
        <Text fontWeight={'medium'}>{t('Branches')}</Text>
      </Flex>
      
      <Box position={'relative'} mt='10px'> 
          <Box marginLeft={'35px'} paddingTop='5px' paddingBottom={'15px'}>
            {data.branches.map((branch, index) => (
              <Box key={`branch-${index}`} position="relative">
                  <svg width="18px" height="40px" viewBox="0 0 30 40" style={{ position: 'absolute', left: '-22px', top: '50%', transform: 'translateY(-50%)' }}>
                    <path d="M30 20 C16.5 20, 0 20, 0 0" stroke="#A0AEC0" strokeWidth="3"  fill="transparent"/>
                  </svg>
                <Flex display={'inline-flex'} mt='8px' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} borderRadius={'.3rem'} onClick={() => data.setShowNodesAction({nodeId:'1', actionType:'condition', actionData:{index}})} p='4px'>  
                    <Text fontSize={'.7em'}>{branch.name?branch.name:t('NoCondition')}</Text>
                </Flex>
              </Box>
            ))}
            <Button mt='10px' size='xs' onClick={() => data.editBranch(id, -1, 'add')}>{t('AddBranch')}</Button> 
          </Box>
          <Box height={('100%')}  left={'13px'} width={'2px'} bg='gray.400' position={'absolute'} top={0}/>
      </Box>
      <Box position="relative" marginLeft={'35px'} mt='-1px'>
          <svg width="18px" height="40px" viewBox="0 0 30 40" style={{ position: 'absolute', left: '-22px', top: '50%', transform: 'translateY(-50%)' }}>
            <path  d="M30 20 C16.5 20, 0 20, 0 0"  stroke="#A0AEC0" strokeWidth="3"  fill="transparent"/>
          </svg>
          <Text fontSize={'.6em'} fontWeight={'medium'}>{t('Else').toUpperCase()}</Text>
      </Box>

     </Box>
  )
}

//EXTRACTOR NODE
export const ExtactorNode = ({data}:{data:ExtractorNodeData}) => {
    return (
      <Flex bg="red.400" p='20px' borderRadius={'50%'} alignItems={'center'} justifyContent={'center'} color={'white'}  border="5px solid" borderColor="white" >

          <Handle type="source"  position={Position.Bottom} style={{ background: '#555' }} />
          <Handle type="source"  position={Position.Top} style={{ background: '#555' }} />
          <Handle type="source"  position={Position.Right} style={{ background: '#555' }} />
          <Handle type="source"  position={Position.Left} style={{ background: '#555' }} />
      </Flex>
    )
  }


