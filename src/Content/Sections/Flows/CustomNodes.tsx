//REACT
import { Dispatch, SetStateAction, useEffect, useRef, useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../AuthContext.js'
//FRONT
import { Flex, Icon, Box, Text, Checkbox, Grid, Button, NumberInput, NumberInputField } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Handle, Position } from 'reactflow'
//COMPONENTS
import CustomSelect from '../../Components/CustomSelect.js'
//FUNCTIONS
import useOutsideClick from '../../Functions/clickOutside.js'
//ICONS
import { IconType } from 'react-icons'
import { IoMdChatbubbles } from "react-icons/io"
import { FaExchangeAlt, FaRegEdit } from 'react-icons/fa'
import { BsFillNodePlusFill, BsThreeDotsVertical, BsTrash3Fill } from 'react-icons/bs'
import { IoIosArrowDown } from "react-icons/io"
import { IoSend, IoCheckmarkCircleSharp, IoArrowRedo } from "react-icons/io5"
import { FaCodeBranch, FaDatabase, FaPlus, FaTicket, FaUserCheck, FaCode, FaArrowRotateLeft, FaShareNodes } from "react-icons/fa6"
//TYPING
import { languagesFlags, logosMap, Channels, actionTypesDefinition, nodeTypesDefinition, Branch, FlowMessage, DataTypes, FieldAction } from '../../Constants/typing.js'
 
//VARIABLE TYPE
type VariableType = {name:string, type:DataTypes, description:string, examples:any[], values:any[], ask_for_confirmation:boolean}

//FIRST NODE DATA
interface TriggerNodeData {
  channels:Channels[]
  setChannels:Dispatch<SetStateAction<Channels[]>>
}
//BRANCHER NODE DATA
interface BrancherNodeData {
  branches:Branch[]
  functions: {
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editBranch:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'remove-branch') => void
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }
}
//EXTRACTOR NODE DATA
interface ExtractorNodeData {
  variables:{index:number, message:FlowMessage, require_confirmation:boolean, confirmation_message:FlowMessage}[]
  branches:Branch[]
  functions: {
    flowVariables:VariableType[]
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editBranch:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'remove-branch') => void
    editExtractor:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add') => void
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }
}
//SENDER MESSAGE DATA
interface SenderNodeData {
  messages:FlowMessage[]
  next_node_index:string | null
  functions: {
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }
}
//FUNCTION NODE DATA
interface FunctionNodeData {
  uuid:string
  variable_args:{[key:string]:number}
  motherstructure_args:{ motherstructure:'ticket' | 'client' | 'contact_business', is_customizable:boolean, name:string}
  hardcoded_args:{[key:string]:any}
  error_nodes_ids:{[key:number]:number | null}
  output_to_variables:{[key:string]:number}
  next_node_index:string | undefined 
  functions: {
    functionsDict:{[key:string]:string}
    editSimpleFlowData:(nodeId:string | undefined, keyToUpdate:string, newData:any ) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }
}
//TERMINATOR NODE DATA
interface TerminatorNodeData {
  messages:FlowMessage[]
  flow_result:string
  functions: {
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void
  }
}
//TRANSFER NODE DATA
interface TransferNodeData {
  messages:FlowMessage[]
  group_id:number
  user_id:number
  functions: {
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editSimpleFlowData:(nodeId:string | undefined, keyToUpdate:string, newData:number | string ) => void
    editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void
  }
}
//RESET NODE DATA
interface ResetNodeData {
  messages:FlowMessage[]
  variable_indexes:number[]
  functions: {
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editSimpleFlowData:(nodeId:string | undefined, keyToUpdate:string, newData:number | string ) => void
    editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }

}
//FLOW SWAP NODE DATA
interface FlowSwapData {
  messages:FlowMessage[]
  new_flow_uuid:string
  functions: {
    flowsIds:{name:string, id:string}[]
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editSimpleFlowData:(nodeId:string | undefined, keyToUpdate:string, newData:number | string ) => void
    editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void
  }
}
//MOTHERSTRUCTURE UPDATES
interface MotherStructureUpdateNodeData { 
  next_node_index:string | null
  updates:FieldAction[]
  functions: {
    setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>
    editFieldAction:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newField?:FieldAction ) => void
    deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void
    addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void
    getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]
  }
}

//MOTION BOX
const MotionBox = motion(Box)
 
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
  
  return (<> 
    <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='blue.100' borderWidth={'2px'} p='15px' >
        <Flex gap='20px' alignItems={'center'}> 
          <Flex justifyContent={'center'} bg='blue.400' alignItems={'center'} p='10px' borderRadius={'full'}> 
            <Icon color='white' boxSize={'20px'} as={IoMdChatbubbles}/>
          </Flex>
          <Text fontWeight={'medium'}>{t('FirstNode')}</Text>
        </Flex>
        <Box width={'100%'} height={'1px'} mt='20px' mb='20px' bg='gray.300'/>
        <Text fontSize={'.8em'} fontWeight={'medium'} color='gray.600'>{t('Channels')}</Text>
        <Grid mt='10px' templateColumns="repeat(1, 0fr)"  columnGap="30px" rowGap="10px">
          {Object.keys(logosMap).map((channel, index) => (
            <ChannelComponent channel={channel as Channels} key={`channel-${index}`}/>
          ))}
        </Grid>
    </Box>
    <Handle position={Position.Right} type='source'style={{visibility:'hidden'}} />
  </>)
}

//NODE TO ADD THE FIRST NODE
export const AddNode = ({data}:{data:{addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void}}) => {
 
  //TRANSLATION
  const { t } = useTranslation('flows')

  //SHOW NODE TYPES LOGIC
  const boxRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [showNodeTypes, setShowNodeTypes] = useState<boolean>(false)
  useOutsideClick({ref1:boxRef, ref2:buttonRef, onOutsideClick:setShowNodeTypes})
 
  return (<>  
      <Box cursor={'default'}  borderStyle="dashed"  textAlign={'center'} bg="RGBA(255, 255, 255, 0.1)" borderRadius={'.5rem'} borderColor='gray.400' borderWidth={'1px'} p='15px' width='250px'>
        <Text fontSize={'.9em'} fontWeight={'medium'} color={'gray.600'}>{t('FistNode')}</Text>
        <Text fontSize={'.7em'} color={'gray.600'}>{t('StartFlow')}</Text>

        <Flex position={'relative'} mt='30px'> 
          <Button size='sm' width={'100%'} leftIcon={<BsFillNodePlusFill/>} borderWidth={'1px'} borderColor={'gray.300'} ref={buttonRef} onClick={() => setShowNodeTypes(!showNodeTypes)}>{t('AddFirstNode')}</Button>
            {showNodeTypes && 
              <Box ref={boxRef} position={'absolute'} bottom={0} left={'calc(100% + 5px)'}>
                <NodesBox disabledNodes={[]} sourceData={{sourceId:'1', sourceType:'add'}} addNewNode={data.addNewNode}/>
              </Box>
            }
        </Flex>
      </Box>
      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
    </>)
}

//BRANCHER NODE
export const BrancherNode = ({id, data}:{id:string, data:BrancherNodeData}) => {

  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  return (<> 
      <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} width='250px'>
          <NodeHeader nodeId={id} nodeType='brancher' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          {isExpanded && 
            <Box p='0 15px 15px 15px'> 
              <BranchesComponent id={id} branches={data.branches }isExpanded={isExpanded} editBranch={data.functions.editBranch} setShowNodesAction={data.functions.setShowNodesAction} addNewNode={data.functions.addNewNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          </Box>}
      </Box>
      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
      {data.branches.length === 0 && <Handle position={Position.Right} type='source' id={`handle-x`} style={{position:'absolute', top:'30px', visibility:'hidden'}} />}

      {!isExpanded && <>{Array.from({length: data.branches.length + 1}, (v, i) => i).map((i) => (<Handle id={`handle-${i}`} key={`handle-${id}-${i}`}  position={Position.Right} type='source' style={{position:'absolute', top:'30px', visibility:'hidden'}}/>))}</>}
    </>)
}

//EXTRACTOR NODE
export const ExtactorNode = ({id, data}:{id:string, data:ExtractorNodeData}) => {
    
  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  //TRANSLATION
  const { t } = useTranslation('flows')

  const EditorComponent = ({variable, index}:{variable:{index:number, message:FlowMessage}, index:number}) => {

    const [isHovering, setIsHovering] = useState<boolean>(false)

    return(
      <Box position='relative' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}> 
        <Box cursor={'pointer'}  mt='15px' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}p='10px' borderRadius={'.3rem'} borderTopColor={'#4A5568'} borderTopWidth='3px' key={`variable-${index}`} onClick={() => data.functions.setShowNodesAction({nodeId:id, actionType:'extract', actionData:{index}})}>
          <Text fontSize='.7em' fontWeight={'medium'}>{t(data.functions.flowVariables.length === 0?t('NoVariable'):data.functions.flowVariables[variable.index].type)}</Text>
          <Text fontSize='.5em'  style={{overflow: 'hidden',display: '-webkit-box',WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}} ><span style={{fontWeight:500, color:'#4A5568'}}> {t('Instructions')}:</span> {variable.message.generation_instructions}</Text>
        </Box>
        {(isHovering) && 
          <Flex alignItems={'center'} position={'absolute'} borderRadius={'full'} p='3px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} onClick={() => data.functions.editExtractor(id, index, 'remove')}>
            <Icon boxSize={'10px'} as={BsTrash3Fill} color='red'/>
          </Flex>}
      </Box>
    )
  }
  return (<>
      <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} width='250px'>
        <NodeHeader nodeId={id} nodeType='extractor'  isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode} getAvailableNodes={data.functions.getAvailableNodes}/>
   
          {isExpanded && <Box p='0 15px 15px 15px'> 
          <Flex  mb='10px' gap='15px' alignItems={'center'}  > 
            <Flex justifyContent={'center'} bg='red.400' alignItems={'center'} p='9px' borderRadius={'full'}> 
              <Icon color='white' boxSize={'17px'} as={FaDatabase}/>
            </Flex>
            <Text fontWeight={'medium'}>{t('Extractor')}</Text>
          </Flex>
  
          {data.variables.map((variable, index) => (
            <EditorComponent variable={variable} index={index}/>
          ))}
          <Flex flexDir={'row-reverse'}> 
            <Button mt='15px' leftIcon={<FaPlus/>} size='xs'  onClick={() => data.functions.editExtractor(id, -1, 'add')}>{t('AddData')}</Button>
          </Flex>
          {data.branches.length === 0 && <Button mt='15px' leftIcon={<FaPlus/>} size='sm' width={'100%'} onClick={() => data.functions.editBranch(id, -1, 'add')}>{t('AddBranches')}</Button>}

          {data.branches.length > 0 && <Box mt='30px'> 
            <BranchesComponent id={id} branches={data.branches} editBranch={data.functions.editBranch} isExpanded={true} setShowNodesAction={data.functions.setShowNodesAction} addNewNode={data.functions.addNewNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          </Box>}
        </Box>}
      </Box>

      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
      {!isExpanded && <>{Array.from({length: data.branches.length + 1}, (v, i) => i).map((i) => (<Handle id={`handle-${i}`} key={`handle-${id}-${i}`} position={Position.Right} type='source' style={{position:'absolute', top:'30px', visibility:'hidden'}}/>))}</>}

    </>)
}

//SEND MESSAGES NODE
export const SenderNode = ({id, data}:{id:string, data:SenderNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  //BOOLEAN FOR EXPANDING
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  return (<> 
    <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'}  width='250px'>
        <NodeHeader nodeId={id} nodeType='sender'  next_node_index={data.next_node_index} isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode} addNewNode={data.functions.addNewNode}/>
 
          {isExpanded && <Box p='0 15px 15px 15px'> 
            <Flex gap='15px' alignItems={'center'} > 
              <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                <Icon color='white' boxSize={'15px'} as={IoSend}/>
              </Flex>
              <Text fontWeight={'medium'}>{t('Message')}</Text>
            </Flex>
          <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
          </Box>}
    </Box>

    <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
    <Handle position={Position.Right} type='source' style={{visibility:'hidden', top:'30px', position:'absolute'}} />
  </>)
}

//TERMINATOR NODE
export const TerminatorNode = ({id, data}:{id:string, data:TerminatorNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  //BOOLEAN FOR EXPANDING
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  return (<> 
    <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'}  width='250px'>
        <NodeHeader nodeId={id} nodeType='terminator' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode}/>
          {isExpanded && 
          <Box p='0 15px 15px 15px'> 
            <Flex gap='15px' alignItems={'center'} > 
              <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                <Icon color='white' boxSize={'15px'} as={IoCheckmarkCircleSharp}/>
              </Flex>
              <Text fontWeight={'medium'} >{t('End')}</Text>
            </Flex>
            <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('FlowMessagesTerminator')}:</Text>
            <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
          </Box>}

    </Box>
    <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />

    <Flex position="absolute" top="15px" ml="calc(100% + 2px)" minW='1000%' color="white"cursor={'pointer'} onClick={() => data.functions.setShowNodesAction({nodeId:id, actionType:'flow_result', actionData:{}})}>
      <Box as="svg" width="2" height="2" mr='-1px' viewBox="0 0 10 10" mt='10px'>
        <polygon points="0,5 10,0 10,10" fill="#F56565" />
      </Box>
      <Text fontSize=".8em" bg='red.400' borderRadius=".3em" p="5px"  maxW={'250px'} >
        {data.flow_result ? data.flow_result : t('FlowResult')}
      </Text>
    </Flex>
  </>)
}

//TRANSFER NODE
export const TransferNode = ({id, data}:{id:string, data:TransferNodeData}) => {

   //TRANSLATION
   const { t } = useTranslation('flows')
    const auth = useAuth()
   //BOOLEAN FOR EXPANDING
   const [isExpanded, setIsExpanded] = useState<boolean>(true)
 
   let usersDict:{[key:number]:string} = {}
   if (auth.authData.users) Object.keys(auth.authData?.users).map((key:any) => {if (auth?.authData?.users) usersDict[key] = auth?.authData?.users[key].name})
   usersDict[0] = t('NoAgent')
   usersDict[-1] = 'Matilda'

   return (<> 
     <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'}  width='250px'>
         <NodeHeader nodeId={id} nodeType='transfer' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode}/>
           {isExpanded && 
           <Box p='0 15px 15px 15px'> 
             <Flex gap='15px' alignItems={'center'} > 
               <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                 <Icon color='white' boxSize={'15px'} as={FaUserCheck}/>
               </Flex>
               <Text fontWeight={'medium'} >{t('Transfer')}</Text>
             </Flex>
             <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('TransferAgent')}</Text>
             <CustomSelect selectedItem={data.user_id} options={Object.keys(usersDict).map(key => parseInt(key))} labelsMap={usersDict} setSelectedItem={(value) => data.functions.editSimpleFlowData(id, 'user_id', value)} hide={false} />
             <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('TransferGroup')}</Text>
             <CustomSelect selectedItem={data.user_id} options={Object.keys(usersDict).map(key => parseInt(key))} labelsMap={usersDict} setSelectedItem={(value) => data.functions.editSimpleFlowData(id, 'user_id', value)} hide={false} />
             <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('FlowMessagesTransfer')}:</Text>
             <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
           </Box>}
 
     </Box>
     <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
   </>)
}

//TRANSFER NODE
export const ResetNode = ({id, data}:{id:string, data:ResetNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  return (<> 
      <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} width='250px'>
          <NodeHeader nodeId={id} nodeType='reset' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          {isExpanded &&   
            <Box p='0 15px 15px 15px'> 
            <Flex gap='15px' alignItems={'center'} > 
              <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                <Icon color='white' boxSize={'15px'} as={FaArrowRotateLeft}/>
              </Flex>
              <Text fontWeight={'medium'} >{t('Reset')}</Text>
            </Flex>
            <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('ResetVariables')}</Text>
            <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
            <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('ResetMessage')}</Text>
            <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
          </Box>}
      </Box>
      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
    </>)
}

//FLOW SWAP NODE
export const FlowSwapNode = ({id, data}:{id:string, data:FlowSwapData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')
 
  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  const flowsIdsList:string[] = ['-1']
  let flowsDict:{[key:string]:string} = {}
  flowsDict['-1'] = t('NoFlow')
  data.functions.flowsIds.forEach((flow) => {
    flowsIdsList.push(flow.id)
    flowsDict[flow.id] = flow.name
  })
  
  return (<> 
    <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'}  width='250px'>
        <NodeHeader nodeId={id} nodeType='flow_swap' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode}/>
          {isExpanded && 
          <Box p='0 15px 15px 15px'> 
            <Flex gap='15px' alignItems={'center'} > 
              <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                <Icon color='white' boxSize={'15px'} as={FaExchangeAlt}/>
              </Flex>
              <Text fontWeight={'medium'} >{t('FlowChange')}</Text>
            </Flex>
            <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('FlowSwap')}</Text>
            <CustomSelect selectedItem={data.new_flow_uuid} options={flowsIdsList} labelsMap={flowsDict} setSelectedItem={(value) => data.functions.editSimpleFlowData(id, 'new_flow_uuid', value)} hide={false} />
            <Text mt='10px' fontSize={'.8em'} color='gray.600' fontWeight={'medium'}>{t('FlowMessagesTransfer')}:</Text>
            <MessagesComponent id={id} messages={data.messages} setShowNodesAction={data.functions.setShowNodesAction} editMessage={data.functions.editMessage}/>
          </Box>}

    </Box>
    <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
  </>)
}

//FUNCTION NODE
export const FunctionNode = ({id, data}:{id:string, data:FunctionNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  //ERROR CODE TO ADD
  const [codeToAdd, setCodeToAdd] = useState<number>(1)

  //ADD A NEW CODE ERROR
  const handleEditError = (type:'add' | 'remove' | 'remove-branch', keyToEdit?:number, index?:number) => {
    if (type === 'add') {
      data.functions.editSimpleFlowData(id, 'error_nodes_ids', {...data.error_nodes_ids, [codeToAdd]: null})
      setCodeToAdd(1)
    }
    else if (type === 'remove' && keyToEdit !== undefined) {
      const currentErrors = {...data.error_nodes_ids}
      delete currentErrors[keyToEdit]
      data.functions.editSimpleFlowData(id, 'error_nodes_ids', currentErrors)
      data.functions.deleteNode(id, false, true )
    }
    else if (type === 'remove-branch' && keyToEdit !== undefined) {
      const currentErrors = {...data.error_nodes_ids}
      currentErrors[keyToEdit] = null
      data.functions.editSimpleFlowData(id, 'error_nodes_ids', currentErrors)
      data.functions.deleteNode(id, false, true )
    }
  }

  //COMPONENT FOR ERROR REDIRECTS
  const ErrorRedirectsComponent = ({keyToEdit, index}:{keyToEdit:number, index:number}) => {

    //SHOW NODE TYPES LOGIC
    const boxRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(-2)
    useOutsideClick({ref1:boxRef, ref2:buttonRef, onOutsideClick:(bool:boolean) => setSelectedBranchIndex(-2)})
    
    const [isHovering, setIsHovering] = useState<boolean>(false)
    const [isHoveringCondition, setIsHoveringCondition] = useState<boolean>(false)

    return (
      <Box key={`error-${index}`} position="relative" mt='8px' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <Flex position={'relative'} alignItems={'center'} display={'inline-flex'}  > 
          <Box  position='relative' onMouseEnter={() => setIsHoveringCondition(true)} onMouseLeave={() => setIsHoveringCondition(false)} > 
            <Flex minW={'50px'} borderWidth={'1px'} zIndex={1} position={'relative'} bg='white'  display={'inline-flex'} boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} borderRadius={'.3rem'} p='4px'>  
                <Text fontWeight={'medium'} fontSize={'.7em'} noOfLines={1} textOverflow={'ellipsis'} >{keyToEdit}</Text>
            </Flex>
            {(isHoveringCondition) && 
              <Flex alignItems={'center'} position={'absolute'} borderRadius={'full'} p='3px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} onClick={() => handleEditError('remove', keyToEdit, index)}>
                <Icon boxSize={'10px'} as={BsTrash3Fill} color='red'/>
              </Flex>}
          </Box>
          {data.error_nodes_ids[keyToEdit] === null && <Flex cursor={'pointer'} ref={buttonRef} onClick={() => setSelectedBranchIndex(index)} position={'absolute'} left='100%' ml='5px' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
            <Icon as={IoArrowRedo} color='red' boxSize={'10px'}/>
          </Flex>}
          {(selectedBranchIndex === index) && 
            <Box ref={boxRef} position={'absolute'}  left={'calc(100% + 30px)'} bg='white' zIndex={100}>
              <NodesBox disabledNodes={[]} sourceData={{sourceId:id, sourceType:'function', branchIndex:selectedBranchIndex}} addNewNode={data.functions.addNewNode} clickFunc={() => setSelectedBranchIndex(-2)} getAvailableNodes={data.functions.getAvailableNodes}/>
            </Box>
          }
          
        </Flex>
      {(isHovering && data.error_nodes_ids[keyToEdit] !== null) && 
      <Flex cursor={'pointer'} onClick={() => handleEditError('remove-branch', keyToEdit, index)} ref={buttonRef} position={'absolute'} top='3px' left='calc(100% + 7px)' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
        <Icon as={BsTrash3Fill} color='blue.400' boxSize={'10px'}/>
      </Flex>}
      <Box height={'28px'} zIndex={0} top={0}  width={'calc(100% + 15px)'}  bg='transparent' position={'absolute'} />

      {(data.error_nodes_ids[keyToEdit] !== null) && <Box height={'2px'} zIndex={0} top='47%'  width={'calc(100% + 20px)'} bg='gray.400' position={'absolute'} />}
      {isExpanded && <Handle id={`handle-${index}`} position={Position.Right} type='source' style={{position:'absolute', right:'-21px', visibility:'hidden'}} />}

    </Box>
    )
  }

  return (<> 
      <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} width='250px'>
          <NodeHeader nodeId={id} nodeType='function' isExpanded={isExpanded} setIsExpanded={setIsExpanded} deleteNode={data.functions.deleteNode} next_node_index={data.next_node_index} addNewNode={data.functions.addNewNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          {isExpanded &&   
            <Box p='0 15px 15px 15px' cursor={'pointer'}  > 
              <Flex gap='15px' alignItems={'center'} > 
                <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                  <Icon color='white' boxSize={'15px'} as={FaCode}/>
                </Flex>
                <Text fontWeight={'medium'} >{t('Function')}</Text>
              </Flex>
              <Text mt='20px' fontSize='.7em' color='gray.600' fontWeight={'medium'} >{t('FunctionToRun')}:</Text>
              <Text fontSize={data.uuid === ''?'.8em':'.9em'} fontWeight={data.uuid === ''?'normal':'medium'}>{data.uuid === ''?t('NoFunction'):data.functions.functionsDict[data.uuid]}</Text>
              
              {data.uuid !== '' && <>
                <Text  mt='10px' color='gray.600' fontSize={'.7em'} fontWeight={'medium'}>{t('VariableArgs')}</Text>
                {Object.keys(data.variable_args).map((keyToEdit, index) => (
                    <Fragment key={`variable-arg-${index}`}> 
                        <Text fontSize={'.7em'}  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                    </Fragment>
                ))}  
                <Text mt='10px' color='gray.600' fontSize={'.7em'} fontWeight={'medium'}>{t('StructureArgs')}</Text>
                {Object.keys(data.motherstructure_args).map((keyToEdit, index) => (
                    <Fragment key={`motherstructure-arg-${index}`}> 
                        <Text fontSize={'.7em'}  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                    </Fragment>
                ))}   
                <Text  mt='10px'  color='gray.600' fontSize={'.7em'} fontWeight={'medium'}>{t('HarcodedArgs')}</Text>
                {Object.keys(data.hardcoded_args).map((keyToEdit, index) => (
                    <Fragment key={`harcoded-arg-${index}`}> 
                        <Text fontSize={'.7em'}  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                    </Fragment>
                ))}  
                <Text  mt='10px'  color='gray.600' fontSize={'.7em'} fontWeight={'medium'}>{t('OutputArgs')}</Text>
                {Object.keys(data.output_to_variables).map((keyToEdit, index) => (
                    <Fragment key={`output-arg-${index}`}> 
                        <Text fontSize={'.7em'}  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                    </Fragment>
                ))} 
                </>}
                <Button leftIcon={<FaRegEdit/>} width={'100%'} size='xs' mt='10px' onClick={() => data.functions.setShowNodesAction({nodeId:id, actionType:'function', actionData:{}})}>{data.uuid === ''?t('SelectFunction'):t('EditFunction')}</Button>

                <Text  mt='10px' color='gray.600' fontSize={'.7em'} fontWeight={'medium'}>{t('ErrorNodes')}</Text>
                {Object.keys(data.error_nodes_ids).map((keyToEdit, index) => (
                    <ErrorRedirectsComponent keyToEdit={parseInt(keyToEdit)} index={index}/>
                 ))} 
             
                <Flex alignItems={'end'} gap='10px'>
                  <NumberInput flex='1'  mt='5px' width='50%' size={'xs'} value={codeToAdd} onChange={(value) => setCodeToAdd(parseInt(value)) } min={1} max={1000000} clampValueOnBlur={false} >
                    <NumberInputField borderRadius='.5rem'  fontSize={'.7em'} borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                  </NumberInput>  
                  <Button isDisabled={Object.keys(data.error_nodes_ids).includes(String(codeToAdd))} leftIcon={<FaPlus/>}  size='xs' mt='10px' onClick={() => handleEditError('add')}>{t('AddError')}</Button>
                </Flex>
          </Box>}
      </Box>
      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
      <Handle position={Position.Right} type='source' style={{visibility:'hidden', top:'30px', position:'absolute'}} />
      {!isExpanded && <>{Array.from({length: Object.keys(data.error_nodes_ids).length + 1}, (v, i) => i).map((i) => (<Handle id={`handle-${i}`} key={`handle-${id}-${i}`} position={Position.Right} type='source' style={{position:'absolute', top:'30px', visibility:'hidden'}}/>))}</>}

    </>)
}

//FUNCTION NODE
export const MotherStructureUpdateNode = ({id, data}:{id:string, data:MotherStructureUpdateNodeData}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')
  const auth = useAuth()

  //BOOLEAN FOR TOGGING THE NODE VISIBILITY
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  //COMPONENT FOR EACH ACTION
  const ActionComponent = ({action, index}:{action:FieldAction, index:number}) => {

 
    //GET THE CORRECTED MAPPED VALUE
    const getActionValue = (name:string, value:any) =>  {
      switch (name) {
        case 'user_id':{
          let usersDict:{[key:number]:string} = {}
          if (auth?.authData.users) Object.keys(auth.authData?.users).map((key:any) => {if (auth?.authData?.users) usersDict[key] = auth?.authData?.users[key].name})
          usersDict[0] = t('NoAgent')
          usersDict[-1] = 'Matilda'
          return usersDict[value] || ''
        }
        case 'group_id':
          {
              return ''
          }
        case 'channel_type': {
          const channelsMap = {'email':t('email'), 'whatsapp':t('whatsapp'), 'instagram':t('instagram'), 'webchat':t('webchat'), 'google_business':t('google_business'), 'phone':t('phone')}
          return value in channelsMap? channelsMap[value as keyof typeof channelsMap] : 'whatsapp'
        }
        case 'urgency_rating': {
          const ratingMapDic = {0:`${t('Priority_0')} (0)`, 1:`${t('Priority_1')} (1)`, 2:`${t('Priority_2')} (2)`, 3:`${t('Priority_3')} (3)`, 4:`${t('Priority_4')} (4)`}
          return value in ratingMapDic? ratingMapDic[value as keyof typeof ratingMapDic] : 0
        }
        case 'status': {
          const statusMapDic = {'new':t('new'), 'open':t('open'), solved:t('solved'), 'pending':t('pending'), 'closed':t('closed')}
          return value in statusMapDic? statusMapDic[value as keyof typeof statusMapDic] : ''
        }
        case 'is_matilda_engaged':
        case 'unseen_changes':
        case 'is_satisfaction_offered':
        {
          const boolDict = {"True":t('true'), "False":t('false')}
          return value in boolDict? boolDict[value as keyof typeof boolDict] : 'True'
        }
        case 'language': {
          let languagesMap:any = {}
          for (const key in languagesFlags) {
              if (languagesFlags.hasOwnProperty(key)) {
                  const values = languagesFlags[key]
                  languagesMap[key] = values[0]
              }
          }
          return languagesMap[value]
        }

        default: return value
      }
    }

    //BOOLEAN FOR SHOWING THE DELETE BOX
    const [isHovering, setIsHovering] = useState<boolean>(false)

    //FRONT
    return(
      <Box position='relative' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}> 
        <Box cursor={'pointer'}  mt='15px' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}p='10px' borderRadius={'.3rem'} borderTopColor={'black'} borderTopWidth='3px' key={`variable-${index}`} onClick={() => data.functions.setShowNodesAction({nodeId:id, actionType:'edit_fields', actionData:{index}})}>
          <Text fontSize='.7em' ><span style={{fontWeight:500}}>{t('Structure')}:</span> {t(action.motherstructure)}</Text>
          <Text fontSize='.8em'> {t(action.op) + ' ' + t(action.name).toLocaleLowerCase() + ' ' + t(`${action.op}_2`) + getActionValue(action.name, action.value)}</Text>
        </Box>
        {(isHovering) && 
          <Flex alignItems={'center'} position={'absolute'} borderRadius={'full'} p='3px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} onClick={() => data.functions.editFieldAction(id, index, 'remove')}>
            <Icon boxSize={'10px'} as={BsTrash3Fill} color='red'/>
          </Flex>}
      </Box>
    )
  }

  //FRONT
  return (<> 
      <Box cursor={'default'} bg="gray.50" borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} width='250px'>
          <NodeHeader nodeId={id} nodeType='motherstructure_updates' isExpanded={isExpanded} next_node_index={data.next_node_index} setIsExpanded={setIsExpanded} addNewNode={data.functions.addNewNode} deleteNode={data.functions.deleteNode} getAvailableNodes={data.functions.getAvailableNodes}/>
          {isExpanded &&   
            <Box p='0 15px 15px 15px'> 
              <Flex gap='15px' alignItems={'center'} > 
                <Flex justifyContent={'center'} bg='brand.gradient_blue' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
                  <Icon color='white' boxSize={'15px'} as={FaTicket}/>
                </Flex>
                <Text fontWeight={'medium'} >{t('Ticket')}</Text>
              </Flex>
               {data.updates.map((action, index) => (
                <ActionComponent action={action} key={`action-${index}`} index={index}/>
              ))}
              <Button mt='15px' leftIcon={<FaPlus/>} size='sm' width={'100%'} onClick={() => data.functions.editFieldAction(id, -1, 'add')}>{t('AddAction')}</Button>
            </Box>}
      </Box>
      <Handle position={Position.Left} type='target' style={{position:'absolute', top:'30px', visibility:'hidden'}} />
      <Handle position={Position.Right} type='source' style={{visibility:'hidden', top:'30px', position:'absolute'}} />
    </>)
}

//BOX CONTAINIG ALL THE NDOE TYPES
const NodesBox = ({disabledNodes, sourceData, addNewNode, clickFunc, getAvailableNodes }:{disabledNodes:number[], sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number, }, targetType:nodeTypesDefinition | '', nodeId?:string) => void, clickFunc?:() => void, getAvailableNodes?:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')
  
  //AVAILABLE CUSTOM NODES
  const [availableCustomNodes, setAvailableCustomNodes] = useState<string[]>([])
  useEffect(() => {if (getAvailableNodes) setAvailableCustomNodes(getAvailableNodes(sourceData))},[])

  //NODES LIST
  const nodesList:{name:string, description:null | string, node_match:nodeTypesDefinition, icon:IconType}[] = [
    {name: t('Extractor'), description:null, node_match:'extractor', icon:FaDatabase},
    {name: t('Branches'), description: null, node_match:'brancher', icon:FaCodeBranch},
    {name: t('Message'), description: null, node_match:'sender', icon:IoSend},
    {name: t('Transfer'), description: null, node_match:'transfer', icon:FaUserCheck},
    {name: t('FlowChange'), description: null, node_match:'flow_swap', icon:FaExchangeAlt},
    {name: t('Ticket'), description: null, node_match:'motherstructure_updates', icon:FaTicket},
    {name: t('End'), description: null, node_match:'terminator', icon:IoCheckmarkCircleSharp},
    {name: t('Function'), description: null, node_match:'function', icon:FaCode},
    {name: t('Reset'), description: null, node_match:'reset', icon:FaArrowRotateLeft},
  ]

   return(
    <AnimatePresence> 
      <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}    exit={{ opacity: 0, scale: 0.95 }}  transition={{ duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.1 }, scale: {duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0]}}}
      style={{ transformOrigin: 'bottom left' }} className="nowheel" textAlign={'start'} minW={'180px'}  maxH='45vh' overflow={'scroll'} bg='white' p='15px' zIndex={1000} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' borderColor='gray.300' borderWidth='1px' borderRadius='.5rem'>
            {availableCustomNodes.length > 0 && <Text fontWeight={'medium'} fontSize={'.8em'} >{t('CreatedNodes')}</Text>}
            {availableCustomNodes.map((id, index) => (
            <Fragment key={`node-custom-${index}`}> 
              <Flex _hover={{bg:'brand.hover_gray'}} borderRadius={'.5rem'} p='5px' cursor={'pointer'}  alignItems={'center'} gap='10px' onClick={() => {addNewNode(sourceData, '', id);if (clickFunc) clickFunc()}}>
                  <Flex borderRadius={'.5rem'} bg={'gray.500'} color='white' justifyContent={'center'} alignItems={'center'} p={'6px'}>
                      <Icon boxSize={'12px'} as={FaShareNodes}/>
                  </Flex>
                  <Text fontSize={'.8em'} >{t('Node')} {id.split('-')[2]}</Text>
              </Flex>
            </Fragment>))}
            <Text fontWeight={'medium'} fontSize={'.8em'} >{t('NewNodes')}</Text>
            {nodesList.map((node, index) => (
            <Fragment key={`node-type-${index}`}>   
              {(!disabledNodes.includes(index)) && 
              <Flex _hover={{bg:'brand.hover_gray'}} borderRadius={'.5rem'} p='5px' cursor={'pointer'}  alignItems={'center'} gap='10px' onClick={() => {addNewNode(sourceData, node.node_match);if (clickFunc) clickFunc()}}>
                  <Flex borderRadius={'.5rem'} bg={node.node_match === 'brancher'?'yellow.400':node.node_match === 'extractor'?'red.400':'brand.gradient_blue'} color='white' justifyContent={'center'} alignItems={'center'} p={'6px'}>
                      <Icon transform={node.node_match === 'brancher'?'rotate(90deg)':''} boxSize={'12px'} as={node.icon}/>
                  </Flex>
                  <Text fontSize={'.8em'} >{node.name}</Text>
              </Flex>}
            </Fragment>))}
     
      </MotionBox>
    </AnimatePresence>
  )
}

//HEADER COMPONENT (SHARED FOR ALL NODES)
const NodeHeader = ({nodeId, nodeType, isExpanded, setIsExpanded, deleteNode, getAvailableNodes, addNewNode, next_node_index}:{nodeId:string, nodeType:nodeTypesDefinition, isExpanded:boolean, setIsExpanded:Dispatch<SetStateAction<boolean>>, deleteNode:(nodeId:string, resize?:boolean, delete_branch?:boolean) => void,getAvailableNodes?:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[] , addNewNode?:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void, next_node_index?:string | null}) => {

  let disabledNodes:number[]
  if (nodeType === 'brancher' || nodeType === 'sender' || nodeType === 'reset' || nodeType === 'motherstructure_updates') disabledNodes = [8]
 
  //TRANSLATION
  const { t } = useTranslation('flows')

  //ADD A NEW NODE
  const addButtonRef = useRef<HTMLDivElement>(null)
  const addBoxRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [showNewNode, setShowNewNode] = useState<boolean>(false)
  useOutsideClick({ref1:addButtonRef, ref2:addBoxRef, onOutsideClick:setShowNewNode})

  //DELETE BOX LOGIC
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  useOutsideClick({ref1:buttonRef, ref2:boxRef, onOutsideClick:setShowDelete})

  //RESIZE
  useEffect(() => {
      const timer = setTimeout(() => {deleteNode(nodeId, true, false)}, 50)
      return () => clearTimeout(timer)
  }, [isExpanded, nodeId])

  return (<> 
      <Flex position={'relative'} p='15px' alignItems={'center'} color='gray.600' justifyContent={'space-between'} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}> 
        
        <Box position={'relative'}> 
          <Flex alignItems={'center'} fontWeight={'medium'}  fontSize={'.8em'}  gap='5px' ref={buttonRef} onClick={() => setShowDelete(!showDelete)}> 
              <Icon cursor={'pointer'} as={BsThreeDotsVertical} />
              <Text>{nodeId.split('-')[2]}.</Text>
          </Flex>
          <AnimatePresence> 
            {showDelete && 
              <MotionBox initial={{ opacity: 0, marginTop: -10 }} animate={{ opacity: 1, marginTop: 0 }}  exit={{ opacity: 0,marginTop: -10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0], opacity: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                maxH='40vh' p='7px' overflow={'scroll'} gap='10px' ref={boxRef} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='gray.50' zIndex={100000}   position={'absolute'} borderRadius={'.3rem'} >
                <Flex color='black'  fontSize={'.9em'}  _hover={{bg:'gray.200'}} borderRadius={'.5rem'} p='5px' cursor={'pointer'}  alignItems={'center'} gap='10px' onClick={() => deleteNode(nodeId)}>
                    <Icon as={BsTrash3Fill}/>
                    <Text whiteSpace={'nowrap'} >{t('DeleteNode')}</Text>
                </Flex>
              </MotionBox>
            }
          </AnimatePresence>
        </Box>
        <IoIosArrowDown onClick={() => setIsExpanded(!isExpanded)} className={!isExpanded ? "rotate-icon-up" : "rotate-icon-down"}/>
        
        {(isHovering && addNewNode) && <> {next_node_index ? 
          <Flex cursor={'pointer'} onClick={() => deleteNode(nodeId, false, true)} position={'absolute'} left='100%' ml='-8px' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
            <Icon as={BsTrash3Fill} color='red' boxSize={'10px'}/>
          </Flex>
          :
          <Flex cursor={'pointer'} ref={addButtonRef} onClick={() => setShowNewNode(true)} position={'absolute'} left='100%' ml='-8px' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
            <Icon as={IoArrowRedo} color='blue.400' boxSize={'10px'}/>
          </Flex>
        }
        </>}

      {(showNewNode && addNewNode) && 
        <Box ref={addBoxRef} position={'absolute'}  left={'calc(100% + 15px)'} bg='white' zIndex={100}>
          <NodesBox disabledNodes={[]} sourceData={{sourceId:nodeId, sourceType:nodeType}} addNewNode={addNewNode} clickFunc={() => {setIsHovering(false);setShowNewNode(false)}} getAvailableNodes={getAvailableNodes}/>
        </Box>
      }
      </Flex>

      
</>)
}

//BRANCHES COMPONENT
const BranchesComponent = ({id, branches, isExpanded, setShowNodesAction, editBranch, addNewNode, getAvailableNodes }:{id:string, branches:Branch[], isExpanded:boolean, setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>, editBranch:(nodeId:string | undefined, index:number | undefined, type:'remove-branch' | 'remove' | 'add') => void, addNewNode:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => void, getAvailableNodes:(sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => string[]}) => {
  
  //TRANSLATION
  const { t } = useTranslation('flows')

  //SHOW NODE TYPES LOGIC
  const boxRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(-2)
  useOutsideClick({ref1:boxRef, ref2:buttonRef, onOutsideClick:(bool:boolean) => setSelectedBranchIndex(-2)})

  const BranchComponent = ({branch, index}:{branch:Branch, index:number}) => {

    const [isHovering, setIsHovering] = useState<boolean>(false)

    const [isHoveringCondition, setIsHoveringCondition] = useState<boolean>(false)

    return (
     <Box key={`branch-${index}`} position="relative" mt='8px' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      {index !== branches.length - 1  && <Box height={'calc(100% + 15px)'}  left={'-22px'} width={'2px'} bg='gray.400' position={'absolute'} top={0}/>}

      <svg width="18px" height="40px" viewBox="0 0 30 40" style={{ position: 'absolute', left: '-22px', top: '50%', transform: 'translateY(-50%)' }}>
        <path d="M30 20 C16.5 20, 0 20, 0 0" stroke="#A0AEC0" strokeWidth="3"  fill="transparent"/>
      </svg>
      <Flex position={'relative'} alignItems={'center'} display={'inline-flex'}  > 
        <Box position='relative' onMouseEnter={() => setIsHoveringCondition(true)} onMouseLeave={() => setIsHoveringCondition(false)} > 
          <Flex  borderColor={branch.conditions.length === 0?'red':''} borderWidth={'1px'} zIndex={1} position={'relative'} bg='white'  display={'inline-flex'}   boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} borderRadius={'.3rem'} onClick={() => setShowNodesAction({nodeId:id, actionType:'condition', actionData:{index}})} p='4px'>  
              <Text fontSize={'.7em'} noOfLines={1} textOverflow={'ellipsis'} >{branch.name?branch.name: `${t('Branch')} ${index}`}</Text>
          </Flex>
        {(isHoveringCondition) && 
          <Flex alignItems={'center'} position={'absolute'} borderRadius={'full'} p='3px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} onClick={() => editBranch(id, index, 'remove')}>
            <Icon boxSize={'10px'} as={BsTrash3Fill} color='red'/>
          </Flex>}
        </Box>
        {branch.next_node_index === null && <Flex cursor={'pointer'} ref={buttonRef} onClick={() => setSelectedBranchIndex(index)} position={'absolute'} left='100%' ml='5px' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
          <Icon as={IoArrowRedo} color='red' boxSize={'10px'}/>
        </Flex>}
        {(selectedBranchIndex === index) && 
          <Box ref={boxRef} position={'absolute'}  left={'calc(100% + 30px)'} bg='white' zIndex={100}>
            <NodesBox disabledNodes={[]} sourceData={{sourceId:id, sourceType:'brancher', branchIndex:selectedBranchIndex}} addNewNode={addNewNode} clickFunc={() => setSelectedBranchIndex(-2)} getAvailableNodes={getAvailableNodes}/>
          </Box>
        }
        
      </Flex>
      {(isHovering && branch.next_node_index !== null) && 
      <Flex cursor={'pointer'} onClick={() => editBranch(id, index, 'remove-branch')} ref={buttonRef} position={'absolute'} top='3px' left='calc(100% + 7px)' zIndex={100} bg='white' display={'inline-flex'} p='4px' alignItems={'center'} justifyContent={'center'}  boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}  borderRadius={'50%'}>
        <Icon as={BsTrash3Fill} color='blue.400' boxSize={'10px'}/>
      </Flex>}
      <Box height={'28px'} zIndex={0} top={0}  width={'calc(100% + 15px)'}  bg='transparent' position={'absolute'} />

      {(branch.next_node_index !== null) && <Box height={'2px'} zIndex={0} top='47%'  width={'calc(100% + 20px)'} bg='gray.400' position={'absolute'} />}
      {isExpanded && <Handle id={`handle-${index}`} position={Position.Right} type='source' style={{position:'absolute', right:'-21px', visibility:'hidden'}} />}
    </Box>)
  }

  return(<> 
    <Flex gap='15px' alignItems={'center'}  > 
      <Flex justifyContent={'center'} bg='yellow.400' alignItems={'center'} p='7px' borderRadius={'.5rem'}> 
        <Icon color='white' boxSize={'15px'} as={FaCodeBranch} transform={'rotate(90deg)'}/>
      </Flex>
      <Text fontWeight={'medium'}>{t('Branches')}</Text>
    </Flex>
    
    <Box position={'relative'} mt='10px'> 
        <Box marginLeft={'35px'} paddingTop='5px' paddingBottom={'15px'}>
          {branches.map((branch, index) => (
              <BranchComponent branch={branch} index={index} key={`branch-${index}}`}/>
          ))}
          <Button mt='10px' size='xs' onClick={() => editBranch(id, -1, 'add')}>{t('AddBranch')}</Button> 
        </Box>
     </Box>
    
    </>)
}

//MESSAGES COMPONENT
const MessagesComponent = ({id, messages, setShowNodesAction, editMessage }:{id:string, messages: FlowMessage[],  setShowNodesAction:Dispatch<SetStateAction<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>>,   editMessage:(nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage ) => void}) => {

  //TRANSLATION
  const { t } = useTranslation('flows')

  const EditorComponent = ({message, index}:{message:FlowMessage, index:number}) => {

    const [isHovering, setIsHovering] = useState<boolean>(false)

    const messagesTypeDict = {'generative':t('GeneratedByMatilda'), 'preespecified':t('Literal')}
    return(
      <Box position='relative' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}> 
        <Box cursor={'pointer'}  mt='15px' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'}p='10px' borderRadius={'.3rem'} borderTopColor={'black'} borderTopWidth='3px' key={`variable-${index}`} onClick={() => setShowNodesAction({nodeId:id, actionType:'message', actionData:{index}})}>
          
          <Text fontSize='.7em' ><span style={{fontWeight:500}}>{t('Type')}:</span> {messagesTypeDict[message.type]}</Text>
          
          {message.type === 'generative' ?<> 
          <Text fontSize='.7em' fontWeight={'medium'}>{t('GenerationInstructions')}:</Text>
          <Text fontSize='.5em'  style={{overflow: 'hidden',display: '-webkit-box',WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}} > {message.generation_instructions}</Text>
          </>:
          <Box overflowY={'scroll'}>
            {Object.keys(message.preespecified_messages).map((lng, index) => (
              <Flex mt='5px' key={`message-${index}-${lng}`} gap='5px' alignItems={'center'}>
                <Text>{languagesFlags[lng][1]}</Text>
                <Text textOverflow={'ellipsis'} overflow={'hidden'} whiteSpace={'nowrap'} fontSize={'.5em'}>{message.preespecified_messages[lng]}</Text>
              </Flex>
            ))}
          </Box>}
        </Box>
        {(isHovering) && 
          <Flex alignItems={'center'} position={'absolute'} borderRadius={'full'} p='3px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} onClick={() => editMessage(id, index, 'remove')}>
            <Icon boxSize={'10px'} as={BsTrash3Fill} color='red'/>
          </Flex>}
      </Box>
    )
  } 

  return (
    <Box mt='10px'>
        {messages.map((message, index) => (
          <EditorComponent message={message} key={`message-${index}`} index={index}/>
        ))}
        <Button onClick={() => editMessage(id, -1, 'add')} mt='10px' width={'100%'} leftIcon={<FaPlus/>} size='sm' >{t('AddMessage')}</Button>
    </Box>
  )
}

//CUSTOM EDGE
export const CustomEdge = ({id, sourceX, sourceY, targetX, targetY}: any) => {
  
  const [isHovered, setIsHovered] = useState(false);

  const style = { stroke: isHovered ? '#3182CE' : '#A0AEC0', strokeWidth: 2 }
  const midX = sourceX  - 5 + (targetX - sourceX - 5) / 2
  const curveOffset = 10
  
  const isNextNodeDown = sourceY > targetY

  const path = (Math.abs(sourceY - targetY) < 10) ?
  `M${sourceX},${sourceY} H${targetX}`
  :
  `
    M${sourceX - 5},${sourceY} 
    H${midX - curveOffset} 
    Q${midX},${sourceY} ${midX},${sourceY + (isNextNodeDown?-1:1) *  curveOffset} 
    V${targetY + (isNextNodeDown?1:-1) * curveOffset} 
    Q${midX},${targetY} ${midX + curveOffset},${targetY} 
    H${targetX}
  `
  return (
  <>
    <defs>
    <marker id={id}markerWidth="8"  markerHeight="8" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L4,3 z" fill="#A0AEC0" />
    </marker>
    </defs>
  <path onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} id={id} style={style} className="react-flow__edge-path" d={path}  markerEnd={`url(#${id})`}/>
  
  </>)
}

 

