//REACT
import { useState, useEffect, useRef, RefObject, useMemo, CSSProperties, Dispatch, SetStateAction } from 'react'
import { useAuth } from '../../../AuthContext.js'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from '../../API/fetchData'
//FRONT
import { Flex, Box, Button, IconButton, NumberInput, NumberInputField, Text, Textarea, Portal, Icon } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//FLOWS
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, ControlButton, SelectionMode, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { FirstNode } from './CustomNodes'
import { AddNode } from './CustomNodes'
import { BrancherNode } from './CustomNodes'
import { ExtactorNode } from './CustomNodes'
import { TransferNode } from './CustomNodes'
import { ResetNode } from './CustomNodes'
import { FlowSwapNode } from './CustomNodes'
import { FunctionNode } from './CustomNodes'
import { MotherStructureUpdateNode } from './CustomNodes'
import { SenderNode } from './CustomNodes'
import { TerminatorNode } from './CustomNodes'
import { CustomEdge } from './CustomNodes'
//COMPONENTS
import EditText from '../../Components/EditText.js'
import CustomSelect from '../../Components/CustomSelect.js'
//FUNCTIONS
import useOutsideClick from '../../Functions/clickOutside.js'
import determineBoxStyle from '../../Functions/determineBoxStyle.js'
//ICONS
import { RxCross2 } from 'react-icons/rx'
import { FaPlus } from 'react-icons/fa'
import { IoIosArrowDown } from 'react-icons/io'
import { BsTrash3Fill } from 'react-icons/bs'
//TYPING
import { languagesFlags, Channels, actionTypesDefinition, nodeTypesDefinition, DataTypes, Branch, FlowMessage } from '../../Constants/typing.js'
import ConfirmBox from '../../Components/ConfirmBox.js'

const panOnDrag = [1, 2]
const nodeTypes = {
    trigger: FirstNode,
    add:AddNode,
    brancher:BrancherNode,
    extractor:ExtactorNode,
    sender: SenderNode,
    terminator:TerminatorNode,
    transfer: TransferNode,
    reset: ResetNode,
    flow_swap:FlowSwapNode,
    function: FunctionNode,
    motherstructure_updates: MotherStructureUpdateNode
}
const edgeTypes = { custom: CustomEdge }

type VariableType = {name:string, type:DataTypes, description:string, examples:any[], values:any[], ask_for_confirmation:boolean}

 //MOTION BOX
 const MotionBox = motion(Box)

const Flow = () => {

    //TRANSLATION
    const { t } = useTranslation('flows')

    //CONSTANTS
    const auth = useAuth()
    const location = useLocation().pathname
  
    //MAPPING CONSTANTS
    const dataExtactionDict = {simple:t('simple'), comprehensive:t('comprehensive')}
    const classificationDict = {none:t('none'), simple:t('simple'), comprehensive:t('comprehensive')}

    //REFS AND BAR PROPS
    const flowBoxRef = useRef<HTMLDivElement>(null)
    const nameInputRef = useRef<HTMLDivElement>(null)

    //SHOW NODES EDITOR
    const [showNodesAction, setShowNodesAction] = useState<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>(null)

    //SHOW MORE INFO
    const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false)
    const [showCreateVariable, setShowCreateVariable] = useState<boolean>(false)

    //FLOW DATA
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [flowName, setFlowName] = useState<string>(t('NewFlow'))    
    const [flowDescription, setFlowDescription] = useState<string>('')    
    const [flowVariables, setFlowVariables] = useState<VariableType[]>([])   
    const flowVariablesRef = useRef<VariableType[]>([])
    useEffect(() => {flowVariablesRef.current = flowVariables},[flowVariables])
    const [flowInterpreterConfig, setFlowInterpreterConfig] = useState<{data_extraction_model: 'simple' | 'comprehensive', response_classification_model:'none' | 'simple' | 'comprehensive'}>({data_extraction_model:'comprehensive', response_classification_model:'comprehensive'})    

    //PARSE NODES STRUCTURE TO SEND TO THE BACK
    const parseDataToBack = (nodes:{id:string, type?: string, data?:any}[]) => {
        
        const triggerNode = nodes.find(node => node.type === 'trigger')
        const filteredNodes = nodes.filter(node => node.type !== 'trigger');

        const finalNodes = filteredNodes.map(node => {
            const { functions, ...noFunctionsData } = node.data
                return {id:node.id, type: node.type, ...noFunctionsData}
        })
        return {nodes:finalNodes, channels:triggerNode?.data.channels}
    }
 
    //PARSE NODE DATA FROM BACK TO USE IN THE APP
    const parseNodesFromBack = (nodesBack: Array<{id:string, type: nodeTypesDefinition; [key: string]: any }>) => {
        

        const getNewNodeObject = (node: {id: string, type: nodeTypesDefinition, [key: string]: any }) => {
            const getNodeFunctions = (type:nodeTypesDefinition) => {
                switch (type) {
                    case 'brancher': return  {setShowNodesAction, editBranch, addNewNode, deleteNode}
                    case 'extractor': return {setShowNodesAction, editBranch, editExtractor, addNewNode, deleteNode}
                    case 'sender': return {setShowNodesAction, editMessage, addNewNode, deleteNode}
                    case 'terminator': return {setShowNodesAction, editMessage, deleteNode}
                    case 'transfer': return {setShowNodesAction, editMessage, editSimpleFlowData, deleteNode}
                    case 'reset': return {setShowNodesAction, editMessage, deleteNode}
                    case 'flow_swap': return {flowsIds:[], setShowNodesAction, editMessage, addNewNode, deleteNode}
                    case 'function': return {setShowNodesAction, editMessage, addNewNode, deleteNode}
                    case 'motherstructure_updates': return {setShowNodesAction, editMessage, addNewNode, deleteNode}

                    default:{}
                }
            }
            const { type, ...variableData } = node
            const data = {...variableData, functions: getNodeFunctions(type)}
            return {id:node.id, position:{x:parseInt(node.id.split('-')[0]) * 350, y:parseInt(node.id.split('-')[1]) * 350}, type, data}
        }
        const finalNodes = nodesBack.map(node => {return getNewNodeObject(node)})

        return finalNodes
    }

    //EDIT THE CHANNELS OF THE FLOW
    const setChannels = (channels:Channels[]) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id !== '0') {return node}
            return {...node, data: {...node.data, channels},
            }
          })
        )
    }

    //ADD AND DELETE NEW NODES FUNCTIONS
    const addNewNode = (sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition) => {
   
        const getNewNodeId = (id:string, nds:{id:string, position:{x:number, y:number}, data:any}[]) => {
            const newNodeX = parseInt(id.split('-')[0]) + 1
            const matchingNodes = nds.filter(node => node.id.startsWith(`${newNodeX}-`))

            if (matchingNodes.length > 0) {
                const occupiedRows = new Set(matchingNodes.map((node) => parseInt(node.id.split('-')[1])))
                let firstAvailableRow = 0;
                while (occupiedRows.has(firstAvailableRow)) {firstAvailableRow++}
                return `${newNodeX}-${firstAvailableRow}-${nds.length}`
            } 
            else return `${newNodeX}-0-${nds.length}`
        }

        const getNewNodeObject = (id:string, type:nodeTypesDefinition, nds:any) => {

            const [colIndex, rowIndex] = id.split('-').map(Number)
            const x = colIndex * 350
            const nodesInSameColumn = nds.filter((node:any) => parseInt(node.id.split('-')[0]) === colIndex)
          
            let y = 0
            for (const node of nodesInSameColumn) {
                const nodeRowIndex = parseInt(node.id.split('-')[1])
                if (nodeRowIndex < rowIndex) y += node.height + 30
                else break
            }
        
            const position = { x, y }
            
            let newNodeObjectData = {}
            if (type === 'brancher') newNodeObjectData = {branches:[{name:'',conditions:[], next_node_index:null}], functions:{setShowNodesAction, editBranch, addNewNode, deleteNode}}
            else if (type === 'extractor') newNodeObjectData = {branches:[], variables:[], functions:{flowVariables:flowVariablesRef.current, setShowNodesAction, editBranch, editExtractor, addNewNode, deleteNode}}
            else if (type === 'sender') newNodeObjectData =  {next_node_index:null, messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, addNewNode, deleteNode}}
            else if (type === 'terminator') newNodeObjectData = {flow_result:'', messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, deleteNode}}
            else if (type === 'transfer') newNodeObjectData = {user_id:0, group_id:0, messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, editSimpleFlowData, deleteNode}}
            else if (type === 'reset') newNodeObjectData = {messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, deleteNode}}
            else if (type === 'flow_swap') newNodeObjectData = {new_flow_uuid:'-1', messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{flowsIds:[], setShowNodesAction, editMessage, addNewNode, deleteNode}}
            else if (type === 'function') newNodeObjectData = {functions:{setShowNodesAction, editMessage, addNewNode, deleteNode}}
            else if (type === 'motherstructure_updates') newNodeObjectData = {functions:{setShowNodesAction, editMessage, addNewNode, deleteNode}}

            return {id, position, data: newNodeObjectData, type:targetType}
        }

        if (sourceData.sourceType === 'add') {
            setNodes((nds) => {
                    const newNodeObject = getNewNodeObject('1-0-1', targetType, nds)
                    return nds.map((node) => {
                        if (node.id !== '1') return node
                        return newNodeObject
                    })
                }
            )
            setEdges([{id: '0->1-0-1', type: 'custom', source: '0', target: '1-0-1' }])
        }
        else {      
            let newNodeId:string
            setNodes((nds) => 
            {
                newNodeId = getNewNodeId(sourceData.sourceId,nds)
                if (sourceData.sourceType === 'brancher' || sourceData.sourceType === 'extractor' ) {
                    const nodeIndex = nds.findIndex(node => node.id === sourceData.sourceId)
                    if (nodeIndex !== -1) {
                        const nodeToUpdate = { ...nds[nodeIndex] }

                        if (nodeToUpdate.data && Array.isArray(nodeToUpdate.data.branches)) {
                            const updatedBranches = nodeToUpdate.data.branches.map((branch:any, index:number) => {
                                if (index === sourceData.branchIndex) return {...branch, next_node_index: newNodeId}
                                return branch
                            })
                            nodeToUpdate.data = {...nodeToUpdate.data, branches: updatedBranches}
                        }
                        const updatedNodes = nds.map((node, index) => index === nodeIndex ? nodeToUpdate : node)
                       
                        return [...updatedNodes, getNewNodeObject(newNodeId, targetType, nds)]
                    }
                }
                else {
                    const nodeIndex = nds.findIndex(node => node.id === sourceData.sourceId)
                    if (nodeIndex !== -1) {
                        const nodeToUpdate = { ...nds[nodeIndex], data:{...nds[nodeIndex].data, next_node_index:newNodeId} }
                        const updatedNodes = nds.map((node, index) => index === nodeIndex ? nodeToUpdate : node)
                        return [...updatedNodes, getNewNodeObject(newNodeId, targetType, nds)]
                    }
                }
                return [...nds, getNewNodeObject(newNodeId, targetType, nds)]
            })
            setEdges((edges) => [...edges,  {id:`${sourceData.sourceId}->${newNodeId}`,sourceHandle:(sourceData?.branchIndex !== undefined)?`handle-${sourceData.branchIndex}`:'', type:'custom', source:sourceData.sourceId, target:newNodeId}])
        }
    }
    const deleteNode = (sourceId:string, resize?:boolean, delete_branch?:boolean) => {
        setNodes((nds) => 
            {   
                if (delete_branch) {
                    const [columnIndex] = sourceId.split('-').map(Number)

                    setEdges((edg) => edg.filter((edge) => {
                            const [edgeSource] = edge.id.split('->')
                            return edgeSource !== sourceId
                        })
                    )
                    return nds.map((node) => {
                        const [nodeColIndex] = node.id.split('-').map(Number)
                        if (nodeColIndex === columnIndex) return { ...node, data: { ...node.data, next_node_index: null } }
                        return node
                    })
                }
                else if (resize) {
                    const [columnIndex] = sourceId.split('-').map(Number)
                    let updatedNodes = nds.map((node) => {
                        const [nodeColIndex] = node.id.split('-').map(Number)
                        if (nodeColIndex === columnIndex) return { ...node, position: { ...node.position, y: 0 } }
                        return node
                    })

                    let currentY = 0
                    updatedNodes = updatedNodes.map((node) => {
                        const [nodeColIndex, nodeRowIndex] = node.id.split('-').map(Number)
                        if (nodeColIndex === columnIndex) {
                            const newPosition = { x: nodeColIndex * 350, y: currentY }
                            currentY += (node?.height || 0) + 30
                            return {...node, position: newPosition}
                        }
                        return node
                    })
                    return updatedNodes
                }

                else if (nds.length === 2) 
                {
                    setEdges([{ id: '0->1', type: 'custom', source: '0', target: '1' }])
                    return [{id:'0', position:{x:0, y:0}, data:{channels:[], setChannels}, type:'trigger'}, {id:'1', position:{x:350, y:0}, data:{addNewNode}, type:'add'}]   
                } 
                else {
                    let sourceNode:string = ''
                    let sourceHandle:number = -1

                    setEdges((edg) => edg.filter((edge) => {
                            const [edgeSource, edgeTarget] = edge.id.split('->')
                            sourceNode = edgeSource

                            if (edge.sourceHandle) {
                                 if (edgeTarget === sourceId) sourceHandle = parseInt(edge.sourceHandle.split('-')[1])

                                return edgeTarget !== sourceId
                            }
                            return edgeSource !== sourceId && edgeTarget !== sourceId
                        })
                    )

                    let updatedNodes = nds.map((node) => {
                        if (node.id === sourceNode ) {
                            if (sourceHandle !== -1) {
                                return {...node, data: {...node.data, branches: node.data.branches.map((branch: any, idx: number) => {
                                            if (idx === sourceHandle) return { ...branch, next_node_index: null }
                                            return branch
                                        })
                                    }
                                }
                            }
                            else return {...node, data: {...node.data, next_node_index: null}} 
                        }
                        return node
                    })
                    updatedNodes = updatedNodes.filter((node) => node.id !== sourceId)
                    
                    return updatedNodes
                }
             }
    )}

    //ADD OR DELETE BRANCHES
    const editBranch = (nodeId:string | undefined, index:number | undefined, type:'remove'| 'remove-branch' | 'add' | 'edit', newBranch?:Branch) => {
        setNodes((nds) => nds.map((node) => {
            
            if (node.id !== nodeId) return node
            let updatedBranches
            if (type === 'remove' || type === 'remove-branch') {

                setEdges((edges) => {
                    const filteredEdges = edges.filter((edge) => {
                        const edgeSource = edge.id.split('->')[0];
                        return edgeSource !== nodeId || edge.sourceHandle !== `handle-${index}`
                    })

                    let updatedEdges
                    if (type === 'remove') {
                        updatedEdges = filteredEdges.map((edge) => {
                            const edgeSource = edge.id.split('->')[0];
                            const edgeHandleIndex = edge.sourceHandle?parseInt(edge.sourceHandle.split('-')[1], 10):-1
                                if (edgeSource === nodeId && edgeHandleIndex > (index as number)) {
                                const newHandle = `handle-${edgeHandleIndex - 1}`
                                return {...edge,id: `${nodeId}->${newHandle}`, sourceHandle: newHandle}
                            }
                            return edge;
                        })
                    }
                    else updatedEdges = filteredEdges
                
                    return updatedEdges
                })
                
                if (type === 'remove') updatedBranches = node.data.branches.filter((_:any, idx:number) => idx !== index)
                else {
                    updatedBranches = node.data.branches.map((branch: any, idx: number) => {
                        if (idx === index) return { ...branch, next_node_index: null }
                        return branch
                    })
                }
            }
            else if (type === 'add') updatedBranches = [...node.data.branches, { name: '', conditions: [], next_node_index: null }]
            else if (type === 'edit') {
                updatedBranches = node.data.branches.map((branch: any, idx: number) => {
                  if (idx === index) return newBranch
                  return branch
                })
            }
            return {...node,data: {...node.data,branches: updatedBranches}}  
        })
      )
    }

    //ADD OR DELETE VARIABLE IN EXTRACTOR
    const editExtractor = (nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:{index:number, message:FlowMessage} ) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            let updatedVariables
            if (type === 'remove') updatedVariables = node.data.variables.filter((_:any, idx:number) => idx !== index)
            else if (type === 'add') updatedVariables = [...node.data.variables, { index: 0, message:{type:'generative', generation_instructions:'', preespecified_messages:{}}, require_confirmation:false, confirmation_message:{type:'generative', generation_instructions:'', preespecified_messages:{}}}]
            else if (type === 'edit') {
                updatedVariables = node.data.variables.map((message: any, idx: number) => {
                  if (idx === index) return newMessage
                  return message
                })
            }
            return {...node, data: { ...node.data, variables: updatedVariables}}
        })
      ) 
    }
  
    //ADD OR DELETE A MESSAGE IN SENDER
    const editMessage = (nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newMessage?:FlowMessage) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            let updatedMessages
            if (type === 'remove') updatedMessages = node.data.messages.filter((_:any, idx:number) => idx !== index)
            else if (type === 'add') updatedMessages = [...node.data.messages, {type:'generative', generation_instructions:'', preespecified_messages:{}}]
            else if (type === 'edit') {
                updatedMessages = node.data.messages.map((message: any, idx: number) => {
                  if (idx === index) return newMessage
                  return message
                })
            }
            return {...node, data: { ...node.data, messages: updatedMessages}}
        })
      ) 
    }

    //EDIT SIMPLE FLOW DATA
    const editSimpleFlowData = (nodeId:string | undefined, keyToEdit:string, newData:number | string ) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            return {...node, data: { ...node.data, [keyToEdit]: newData}}
        }))
    }


    const findLastExtractor = (nodeId:string) => {

        let lastExtractorVariables: number[] = []

        function findPreviousNode(nodeId: string, nodes: any[], edges: Edge[]): string | null {
            const edge = edges.find(e => e.id.split('->')[1] === nodeId);
            if (!edge) return null
            const sourceNodeId = edge.id.split('->')[0]
            const sourceNode = nodes.find(n => n.id === sourceNodeId)
            if (!sourceNode) return null
            if (sourceNode.type === 'function') return findPreviousNode(sourceNodeId, nodes, edges)
            return sourceNodeId
        }
        
        setEdges((edges) => {
            setNodes((nodes) => {
                const previousNodeId = findPreviousNode(nodeId, nodes, edges);
                if (previousNodeId) {
                    const extractorNode = nodes.find(n => n.id === previousNodeId)
                    lastExtractorVariables = extractorNode?.data?.variables
                }
                
                return nodes
            })
            return edges
        })
        
        return lastExtractorVariables
    }
    
    //FETCH INITIAL DATA
    useEffect(() => {
        const fetchInitialData = async () => {
            if (location.endsWith('create')) {
                setNodes([{id:'0', position:{x:0, y:0}, data:{channels:[], setChannels}, type:'trigger'}, {id:'1', position:{x:300, y:0}, data:{addNewNode}, type:'add'}])
                setEdges([{ id: '0->1', type: 'custom', source: '0', target: '1' }])
            }
            else {
                const flowId = location.split('/')[location.split('/').length - 1]
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${flowId}`, auth})
                if (response?.status === 200){
                    setFlowName(response.data.name)
                    setFlowDescription(response.data.descrition)
                    setFlowVariables(response.data.variables)
                    setFlowInterpreterConfig(response.data.interpreter_configuration)
                    setNodes([{id:'0', position:{x:0, y:0}, data:{channels:response.data.channels_ids, setChannels}, type:'trigger'}, ...parseNodesFromBack(response.data.nodes)])
                }
                 
            }
        }
        fetchInitialData()
    }, [])

    //SAVE CHANGES
    const saveChanges = async () => {
        const flowId = location.split('/')[location.split('/').length - 1]

        const parsedNodes = parseDataToBack(nodes)
        const newFlow = {name:flowName, description:flowDescription, variables:flowVariables, interpreter_configuration:flowInterpreterConfig, nodes:parsedNodes.nodes, channel_ids:parsedNodes.channels }
        if (location.endsWith('create')) {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/flows`, auth, method:'post', requestForm:newFlow})
        }
        else {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/flows/${flowId}`, auth, method:'put', requestForm:newFlow})
        }
        
    }

    //CUSTOM BOX FOR EDITING NODES
    const NodesEditBox = () => {

        const node = nodes.find(node => node.id === showNodesAction?.nodeId)
        const scrollRef = useRef<HTMLDivElement>(null)

        switch (showNodesAction?.actionType) {

            case 'condition':
                {
                const [branchData, setBranchData] = useState<Branch>(node?.data.branches[showNodesAction?.actionData.index])
                useEffect(()=> {
                    editBranch(showNodesAction?.nodeId, showNodesAction?.actionData.index, 'edit', branchData)
                },[branchData])
        
                const editBranchData = (index: number | undefined, type: 'add' | 'remove' | 'edit', newCondition?: { variable_index: number, op: string, value: any }) => {
                    setBranchData((branch) => {
                        let updatedConditions
                        if (type === 'remove') updatedConditions = branch.conditions.filter((_, idx: number) => idx !== index)
                        else if (type === 'add') updatedConditions = [...branch.conditions, { variable_index: 0, op: 'eq', value: null }]
                        else if (type === 'edit' && newCondition) {
                            updatedConditions = branch.conditions.map((con, idx) => {
                                if (idx === index) return newCondition
                                return con
                            })
                        } 
                        else updatedConditions = branch.conditions
                        return { ...branch, conditions: updatedConditions }
                    })
                }
                 
                const variablesLabelsMap:{[key:number]:string} = {}
                flowVariables.forEach((variable, index) => {variablesLabelsMap[index] = t(flowVariables[index].name)})
        
                
                const columnInequalities = {'bool':['eq', 'exists'], 'int':['leq', 'geq', 'eq', 'neq', 'in', 'nin', 'exists'], 'float':['leq', 'geq', 'eq', 'neq', 'in', 'nin', 'exists'], 'str':['eq', 'neq', 'in', 'nin', 'contains', 'ncontains', 'exists'], 'timestamp':['geq', 'leq', 'eq', 'neq', 'exists'], 'list':['contains', 'ncontains', 'exists'], 'json':['contains', 'ncontains', 'exists'] }
                const inequalitiesMap = {"eq":t('eq'), "neq": t('neq'), "leq": t('leq'), "geq": t('geq'), "in":t('in'), "nin":t('nin'), "contains": t('contains'), "ncontains": t('ncontains'), "exists":t('exists')}

                return (
                    <Box ref={scrollRef} overflow={'scroll'}>
                        <EditText value={branchData.name} setValue={(value:string) => setBranchData((prev) => ({...prev, name:value}))} placeholder={t('AddBranchName')}/>
                        <Box bg='gray.300' width={'100%'} height={'1px'} mt='2vh' mb='2vh'/>
                        {flowVariables.length === 0?<Text fontSize={'.9em'}>{t('NoVariablesSelected')}</Text>:<> 
                        
                        {branchData.conditions.map((condition:{variable_index:number, op:string, value:any}, index:number) => (<> 

                            <Flex mt='.5vh'  key={`all-conditions-${index}`} alignItems='center' gap='20px'>
                                <Box flex='5'> 
                                    <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.variable_index} setSelectedItem={(value) => editBranchData(index, 'edit',{...condition, variable_index:value, value:''})} options={Array.from({length: flowVariables.length}, (v, i) => i)} labelsMap={variablesLabelsMap} />
                                </Box>
                                <Box flex='4'>
                                    <CustomSelect containerRef={scrollRef} labelsMap={inequalitiesMap} hide={false} selectedItem={condition.op} setSelectedItem={(value) => editBranchData(index, 'edit',{...condition, op:value})} options={columnInequalities[flowVariables[condition.variable_index].type]}/>
                                </Box>
                                <Box flex='5'>
                                    <InputType inputType={flowVariables[condition.variable_index].type} value={condition.value} setValue={(value) => editBranchData(index, 'edit',{...condition, value})}/>
                                </Box>
                                <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => editBranchData(index, 'remove')}/>
                            </Flex>
                            {index !== branchData.conditions.length - 1 && <Text mt='1vh' mb='1vh' fontWeight='medium' textAlign={'center'}>{t('And')}</Text>}
                        </>))}
                        <Button size='sm' mt='2vh' leftIcon={<FaPlus/>} onClick={() => editBranchData(0, 'add')}>{t('AddCondition')}</Button>
                        </>}
                    </Box>                    
                )
            }
            case 'extract': {
                const [messageData, setMessageData] = useState<{index:number, message:FlowMessage, require_confirmation:boolean, confirmation_message:FlowMessage}>(node?.data.variables[showNodesAction?.actionData.index])
                const [confirmationMessage, setConfirmationMessage] = useState<FlowMessage>(messageData.confirmation_message)

                useEffect(()=> {
                    setMessageData(prev => ({...prev, confirmation_message:confirmationMessage}))
                },[confirmationMessage])

                useEffect(()=> {
                    editExtractor(showNodesAction?.nodeId, showNodesAction?.actionData.index, 'edit', messageData)
                },[messageData])

                const variablesLabelsMap:{[key:number]:string} = {}
                flowVariables.forEach((variable, index) => {variablesLabelsMap[index] = t(flowVariables[index].name)})
        

                return (
                <Box ref={scrollRef} overflow={'scroll'}>
                    {flowVariables.length === 0?<Text fontSize={'.9em'}>{t('NoVariablesSelected')}</Text>:<> 
                    <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('VariableType')}</Text>
                    <CustomSelect containerRef={scrollRef} hide={false} selectedItem={messageData.index} setSelectedItem={(value) => setMessageData((prev) => ({...prev, index: value}))} options={Array.from({length: flowVariables.length}, (v, i) => i)} labelsMap={variablesLabelsMap} />
                    <Box bg='gray.300' width={'100%'} height={'1px'} mt='2vh' mb='2vh'/>
                    <Text color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('VariableInstructions')}</Text>
                    <Textarea mt='1vh'  maxLength={2000} height={'auto'} placeholder={`${t('VariableInstructionsPlaceholder')}...`} maxH='300px' value={messageData.message.generation_instructions} onChange={(e) => setMessageData((prev) => ({...prev, message:{...prev.message, generation_instructions:e.target.value}}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                    <Text  mt='2vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('AskConfirmation')}</Text>
                    <Flex  gap='10px' mt='5px'>
                        <Button bg={messageData.require_confirmation?'brand.gradient_blue':'gray.200'} color={messageData.require_confirmation?'white':'black'} size='sm' _hover={{bg:messageData.require_confirmation?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setMessageData((prev) => ({...prev, require_confirmation:true}))} >{t('Yes')}</Button>
                        <Button bg={!messageData.require_confirmation?'brand.gradient_blue':'gray.200'} color={!messageData.require_confirmation?'white':'black'} size='sm' _hover={{bg:!messageData.require_confirmation?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setMessageData((prev) => ({...prev, require_confirmation:false}))}>{t('No')}</Button>
                    </Flex> 
                    <Text  mt='2vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('ConfirmationMessage')}</Text>
                    <EditMessage scrollRef={scrollRef} messageData={confirmationMessage} setMessageData={setConfirmationMessage}/>
                    </>}
                </Box>)
            }
            case 'message': {

                const [messageData, setMessageData] = useState<FlowMessage>(node?.data.messages[showNodesAction?.actionData.index])
                useEffect(()=> {
                    editMessage(showNodesAction?.nodeId, showNodesAction?.actionData.index, 'edit', messageData)
                },[messageData])
       
                return (<EditMessage scrollRef={scrollRef} messageData={messageData} setMessageData={setMessageData}/>)
            }

            case 'flow_result':
                const [flowResult, setFlowResult] = useState<string>(node?.data.flow_result)
                useEffect(()=> {
                    editSimpleFlowData(showNodesAction?.nodeId, 'flow_result', flowResult)
                },[flowResult])

                return(
                <Box ref={scrollRef} overflow={'scroll'}>
                    <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('FlowResult')}</Text>
                    <Textarea mt='5px'  maxLength={2000} height={'auto'} placeholder={`${t('FlowResultPlaceholder')}...`} maxH='300px' value={flowResult} onChange={(e) => setFlowResult(e.target.value)} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                </Box>
                )

            default: return <></>
        }
    }

    //MEMOIZED NODE EDITOR
    const memoizedNodesEditor = useMemo(() => (
        <AnimatePresence> 
        {showNodesAction && <>
            <MotionBox initial={{right:-400}} animate={{right:0}}  exit={{right:-400}} transition={{ duration: .15 }} position='fixed' top={0} width='700px' height='100vh' padding='30px' backgroundColor='white' zIndex={201} display='flex' justifyContent='space-between' flexDirection='column'> 
                <NodesEditBox/>
            </MotionBox>
         </>}
    </AnimatePresence>
    ), [showNodesAction])

    //MEMOIZED CREATE VARIABLE BOX
    const memoizedCreateVariable = useMemo(() => (<> 
        {showCreateVariable && 
            <ConfirmBox setShowBox={setShowCreateVariable} isSectionWithoutHeader={true}> 
                <CreateVariable setFlowVariables={setFlowVariables} setShowCreateVariable={setShowCreateVariable}/>
            </ConfirmBox>
         }
     </>), [showCreateVariable])

    //FRONT
    return (<>
        <Flex height={'100vh'} width={'calc(100vw - 60px)'} flexDir={'column'} bg='green' backdropFilter='blur(1px)' >

            <Box left={'2vw'} ref={nameInputRef} top='2vw' zIndex={100} position={'absolute'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.1)'} maxH={'calc(100vh - 4vw)'} overflow={'scroll'} bg='white' borderRadius={'.5rem'} borderWidth={'1px'} borderColor={'gray.300'} > 
                <Flex gap='10px' alignItems={'center'} p='10px'> 
                    <Box width={'400px'} > 
                        <EditText nameInput={true} hideInput={true} size='md' maxLength={70}  value={flowName} setValue={setFlowName}/>
                    </Box>
                    <Button leftIcon={<IoIosArrowDown className={!showMoreInfo ? "rotate-icon-up" : "rotate-icon-down"}/>} size='sm' bg='transparent' borderColor={'transparent'} borderWidth={'1px'} onClick={() => setShowMoreInfo(!showMoreInfo)}>{t('SeeMoreData')}</Button>
                </Flex>
                {showMoreInfo && 
                    <Box p='15px'>
                        <Text fontSize={'.9em'} color='gray.600' fontWeight={'medium'}>{t('Description')}</Text>
                        <Textarea mt='5px'  maxLength={2000} height={'auto'} placeholder={`${t('Description')}...`} maxH='300px' value={flowDescription} onChange={(e) => setFlowDescription(e.target.value)} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                        <Text mt='2vh' fontSize={'.9em'} color='gray.600' fontWeight={'medium'}>Variables</Text>

                        {flowVariables.length === 0 ? <Text mt='1vh' fontSize={'.9em'}>{t('NoVariables')}</Text>:
                            flowVariables.map((variable, index) => (
                            <VariableBox key={`variable-${index}`} variable={variable} index={index} setFlowVariables={setFlowVariables}/>
                        ))} 
                        <Flex flexDir={'row-reverse'} mt='1vh'> 
                            <Button size='sm' leftIcon={<FaPlus/>} mt='1vh' onClick={() => setShowCreateVariable(true)}>{t('CreateVariable')}</Button>
                        </Flex>
                        <Text mt='2vh' fontSize={'.9em'} color='gray.600' fontWeight={'medium'}>{t('Interpreter_Config')}</Text>
                        <Flex gap='30px'>
                            <Box flex={1} mt='.5vh'>
                                <Text mb='5px' fontSize={'.8em'} fontWeight={'medium'}>{t('Data_Extraction_Model')}</Text>
                                <CustomSelect hide={false} selectedItem={flowInterpreterConfig.data_extraction_model} setSelectedItem={(value) => setFlowInterpreterConfig((prev) => ({...prev, data_extraction_model:value  as 'simple' | 'comprehensive'}))} options={Object.keys(dataExtactionDict)}  labelsMap={dataExtactionDict}/>
                            </Box>
                            <Box flex={1} mt='.5vh'>
                                <Text mb='5px' fontSize={'.8em'} fontWeight={'medium'}>{t('Data_Classification_Model')}</Text>
                                <CustomSelect hide={false} selectedItem={flowInterpreterConfig.response_classification_model} setSelectedItem={(value) => setFlowInterpreterConfig((prev) => ({...prev ,response_classification_model:value as  'none' | 'simple' | 'comprehensive'}))} options={Object.keys(classificationDict)}  labelsMap={classificationDict}/>
                            </Box>
                        </Flex>
                    </Box>}
            </Box>
       

            <Flex gap='15px'  position={'absolute'} right={'2vw'} top='2vw' zIndex={100}  >
                <Button size='sm' bg='transparent' borderColor={'gray.300'} borderWidth={'1px'}>{t('Test')}</Button>
                <Button size='sm' bg='red.400' _hover={{bg:'red.500'}}  color='white'>{t('Close')}</Button>
                <Button size='sm' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} color='white'>{t('SaveChanges')}</Button>
            </Flex>


            <Box width={'100%'} height={'100%'}bg='gray.100' ref={flowBoxRef} >   
                <ReactFlow nodesDraggable={false} panOnScroll selectionOnDrag panOnDrag={panOnDrag} selectionMode={SelectionMode.Partial} defaultViewport={{ x: 100, y: 200, zoom: 1 }}   nodes={nodes} nodeTypes={nodeTypes}  edgeTypes={edgeTypes} onNodesChange={onNodesChange} edges={edges} onEdgesChange={onEdgesChange}>
                    <Controls showFitView={false} showInteractive={false} position='bottom-right'>
                        <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        </ControlButton>
                    </Controls>
                    <Background  gap={12} size={1} />
                </ReactFlow>
            </Box>
            {showNodesAction && <motion.div initial={{opacity:0}} onMouseDown={() => setShowNodesAction(null)} animate={{opacity:1}} exit={{opacity:0}}   transition={{ duration: .3 }} style={{backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)',position: 'fixed',top: 0,left: 0,width: '100vw', marginLeft:'-60px',height: '100vh',backgroundColor: 'rgba(0, 0, 0, 0.3)',zIndex: 200}}/>}

            {memoizedNodesEditor}
            {memoizedCreateVariable}
        </Flex>
 
    </>)
}

export default Flow

//BOX FOR SHOWING EACH VARIABLE
const VariableBox = ({variable, index, setFlowVariables}:{variable:VariableType,index:number, setFlowVariables:Dispatch<SetStateAction<VariableType[]>>}) => {
    
    //TRANSLATION
    const { t }  = useTranslation('flows')

    //MAPPING CONSTANTS
    const variablesMap:{[key in DataTypes]:string} = {'bool':t('bool'), 'int':t('int'), 'float':t('float'), 'str':t('str'), 'timestamp':t('timestamp'), 'list':t('list')}
    
    //HOVER BOOLEAN
    const [isHovering, setIsHovering] = useState<boolean>(false)


    return (
        <Box position={'relative'} mt='1vh' fontSize={'.8em'} p='10px' boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} borderRadius={'.5em'} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <Flex  gap='5px' justifyContent={'space-between'}>
                <Text flex={1}><span style={{fontWeight:500}}>{t('name')}:</span> {variable.name}</Text>
            </Flex>
            <Text flex={1}><span style={{fontWeight:500}}>{t('description')}:</span> {variable.description}</Text>

            <Flex  gap='5px' justifyContent={'space-between'}>
                <Text flex={1}><span style={{fontWeight:500}}>{t('Type')}:</span> {variablesMap[variable.type]}</Text>
                <Text flex={1}><span style={{fontWeight:500}}>{t('AskConfirmation')}:</span> {variable.ask_for_confirmation?t('Yes'):t('No')}</Text>
            </Flex>
            <Flex gap='5px' justifyContent={'space-between'}>
                <Text flex={1}><span style={{fontWeight:500}}>{t('Examples')}:</span> {variable.examples.map((example, index) => (<span key={`example-${index}`}>{t(example)} {index < variable.examples.length - 1 && ' - '}</span>))}</Text>
                <Text flex={1} ><span style={{fontWeight:500}}>{t('Values')}:</span> {variable.values.map((value, index) => (<span key={`value-${index}`}>{t(value)} {index < variable.values.length - 1 && ' - '}</span>))}</Text>
            </Flex>
            {(isHovering) && 
            <Flex alignItems={'center'} onClick={() => setFlowVariables((prev) => (prev.filter((_, i) => i !== index)))} position={'absolute'} borderRadius={'full'} p='5px' top={'-7px'} zIndex={100} bg='white' boxShadow={'0 0 5px 1px rgba(0, 0, 0, 0.15)'} right={'-7px'} justifyContent={'center'} cursor={'pointer'} >
                <Icon boxSize={'13px'} as={BsTrash3Fill} color='red'/>
            </Flex>}
        </Box>
        )
}

//CREATING A VARIABLE
const CreateVariable = ({setFlowVariables, setShowCreateVariable}:{setFlowVariables:Dispatch<SetStateAction<VariableType[]>>, setShowCreateVariable:Dispatch<SetStateAction<boolean>>}) => {

    const { t } = useTranslation('flows')
    const variablesMap:{[key in DataTypes]:string} = {'bool':t('bool'), 'int':t('int'), 'float':t('float'), 'str':t('str'), 'timestamp':t('timestamp'), 'list':t('list')}


    const [currentVariable, setCurrentVariable] = useState<{name:string, type:DataTypes, description:string, examples:any[], values:any[], ask_for_confirmation:boolean}>({name:'', type:'bool', description:'', examples:[], values:[], ask_for_confirmation:false})
    
    const [currentExample, setCurrentExample] = useState<string>('')
    const [currentValue, setCurrentValue] = useState<string>('')

    const editList = (keyToEdit:'examples' | 'values', action:'add' | 'delete', index?:number) => {
        if (action === 'add') {
            setCurrentVariable((prev) => ({...prev, [keyToEdit]:[...prev[keyToEdit], keyToEdit==='examples'?currentExample:currentValue]}))
            setCurrentExample('')
            setCurrentValue('')
        }
        else if (action === 'delete' && index !== undefined) setCurrentVariable((prev) => ({...prev, [keyToEdit]: prev[keyToEdit].filter((_, i) => i !== index)}))
        
    }


    return (<> 
        <Box p='15px' minW={'600px'}>
            <Text fontSize={'.9em'} fontWeight={'medium'}>{t('Name')}</Text>
            <EditText  maxLength={70} hideInput={false}  value={currentVariable.name} placeholder={`${t('Name')}...`} setValue={(value) => setCurrentVariable((prev) => ({...prev, name:value})) }/>
            <Text fontSize={'.9em'} mt='1vh' fontWeight={'medium'}>{t('Description')}</Text>
            <Textarea maxLength={2000} height={'auto'} placeholder={`${t('Description')}...`} maxH='300px' value={currentVariable.description} onChange={(e) => setCurrentVariable((prev) => ({...prev, description:e.target.value}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
            <Text fontSize={'.9em'} mt='1vh' fontWeight={'medium'}>{t('Type')}</Text>
            <CustomSelect hide={false} selectedItem={currentVariable.type} setSelectedItem={(value) => setCurrentVariable((prev) => ({...prev, type:value as DataTypes, examples:[], values:[]}))} options={Object.keys(variablesMap)} labelsMap={variablesMap}/>
            <Text fontSize={'.9em'} mt='2vh' fontWeight={'medium'}>{t('AskConfirmation')}</Text>
            <Flex gap='10px' mt='5px'>
                <Button bg={currentVariable.ask_for_confirmation?'brand.gradient_blue':'gray.200'} color={currentVariable.ask_for_confirmation?'white':'black'} size='sm' _hover={{bg:currentVariable.ask_for_confirmation?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setCurrentVariable((prev) => ({...prev, ask_for_confirmation:true}))}>{t('Yes')}</Button>
                <Button bg={!currentVariable.ask_for_confirmation?'brand.gradient_blue':'gray.200'} color={!currentVariable.ask_for_confirmation?'white':'black'} size='sm' _hover={{bg:!currentVariable.ask_for_confirmation?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setCurrentVariable((prev) => ({...prev, ask_for_confirmation:false}))}>{t('No')}</Button>
            </Flex> 

            <Text fontSize={'.9em'} mt='1vh' fontWeight={'medium'}>{t('Examples')}</Text>
            <Flex flexWrap="wrap" gap='5px' alignItems="center" >
                {currentVariable.examples.length === 0?<Text fontSize={'.9em'}> {t('NoExamples')}</Text>:currentVariable.examples.map((variable, index) => (
                    <Flex key={`example-${index}`} borderRadius=".4rem" p='4px' fontSize={'.75em'} alignItems={'center'} m="1"bg='gray.200' gap='5px'>
                        <Text>{t(variable)}</Text>
                        <Icon as={RxCross2} onClick={() => editList('examples', 'delete', index)} cursor={'pointer'} />
                    </Flex>
                ))}
            </Flex>
            <Flex mt='1vh' gap='20px' alignItems={'center'}> 
                <Box width={'70%'}> 
                    <InputType inputType={currentVariable.type} value={currentExample} setValue={(value) => setCurrentExample(value)}/>
                </Box>
                <Button isDisabled={currentExample === ''} leftIcon={<FaPlus/>} flex='1'  size='sm' onClick={() => editList('examples', 'add')}>{t('AddExample')}</Button>
            </Flex>

            <Text fontSize={'.9em'} mt='1vh' fontWeight={'medium'}>{t('Values')}</Text>
            <Flex flexWrap="wrap" gap='5px' alignItems="center" >
                {currentVariable.values.length === 0?<Text fontSize={'.9em'}>{t('NoValues')}</Text>:currentVariable.values.map((variable, index) => (
                    <Flex key={`value-${index}`} borderRadius=".4rem" p='4px' fontSize={'.75em'} alignItems={'center'} m="1"bg='gray.200' gap='5px'>
                        <Text>{t(variable)}</Text>
                        <Icon as={RxCross2} onClick={() => editList('values', 'delete', index)} cursor={'pointer'} />
                    </Flex>
                ))}
            </Flex>            <Flex mt='1vh' gap='20px' alignItems={'center'}> 
                <Box width={'70%'}> 
                    <InputType inputType={currentVariable.type} value={currentValue} setValue={(value) => setCurrentValue(value)}/>
                </Box>
                <Button  isDisabled={currentValue === ''}leftIcon={<FaPlus/>}  flex='1' size='sm' onClick={() => editList('values', 'add')}>{t('AddValue')}</Button>
            </Flex>        
        </Box>
 
        <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
            <Button  isDisabled={currentVariable.name === ''} size='sm' color='white' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} onClick={() => {setShowCreateVariable(false);setFlowVariables(prev => ([...prev,currentVariable]))}}>{t('CreateVariable')}</Button>
            <Button  size='sm' onClick={() => setShowCreateVariable(false)}>{t('Cancel')}</Button>
        </Flex>
        
    </>)
}
 
//INPUT DEPENDING ON THE VARIABLE TYPE
const InputType = ({inputType, value, setValue}:{inputType:DataTypes,value:string, setValue:(value:string) => void}) => {
    
    //USEFUL CONSTANTS
    const { t } = useTranslation('flows')
    const boolDict = {"True":t('true'), "False":t('false')}
    const datesMap = {'{today}':t('today'), '{yesterday}':t('yesterday'), '{start_of_week}':t('start_of_week'),'{start_of_month}':t('start_of_month')}

    switch(inputType) {
        case 'bool':
            return <CustomSelect hide={false} selectedItem={value} setSelectedItem={(value) => setValue(value) }  options={Object.keys(boolDict)} labelsMap={boolDict}/>
        case 'int':
        case 'float':
            <NumberInput value={value} onChange={(value) => setValue(inputType === 'float'?value:String(parseInt(value))) } min={1} max={1000000} clampValueOnBlur={false} >
                <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
            </NumberInput>                
        case 'str':
        case 'list':
                return <EditText value={value} setValue={(value) => setValue(value) } hideInput={false} />
        case 'timestamp':
            return <CustomSelect hide={false} selectedItem={value}  setSelectedItem={(value) => setValue(value)}  options={Object.keys(datesMap)} labelsMap={datesMap}/>

        default: 
            return null
    }

} 


const EditMessage = ({scrollRef, messageData, setMessageData}:{scrollRef:RefObject<HTMLDivElement>, messageData:FlowMessage, setMessageData:Dispatch<SetStateAction<FlowMessage>>}) => {

    const  { t } = useTranslation('flows') 

    //PLACE LANGUAGES FLAG LOGIC
    const buttonRef = useRef<HTMLButtonElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const [showLanguagesBox, setShowLanguagesFlags] = useState<boolean>(false)
    useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef:scrollRef, onOutsideClick:setShowLanguagesFlags})
    const [boxPosition, setBoxPosition] = useState<'top' | 'bottom'>('bottom')
    const [boxStyle, setBoxStyle] = useState<CSSProperties>({})
    determineBoxStyle({buttonRef, setBoxStyle, setBoxPosition, changeVariable:showLanguagesBox})

    const messagesTypeDict = {'generative':t('GeneratedByMatilda'), 'preespecified':t('Literal')}

    let languagesMap:any = {}
    for (const key in languagesFlags) {
        if (languagesFlags.hasOwnProperty(key)) {
            const values = languagesFlags[key]
            languagesMap[key] = values[0]
        }
    }

    const editMessagePreespecified = (lng: string, type: 'add' | 'remove' | 'edit' , newValue?: string) => {
        setMessageData((prev) => {
            let updatedMessages = { ...prev.preespecified_messages }
            if (type === 'edit' && newValue !== undefined) updatedMessages[lng] = newValue
            else if (type === 'remove') delete updatedMessages[lng]
            else if  (type === 'add') updatedMessages[lng] = ''
            return {...prev, preespecified_messages: updatedMessages}
        })
        }
        
    const availableLanguage = Object.keys(languagesMap).filter((lng) => !Object.keys(messageData.preespecified_messages).includes(lng))

    return (
    <Box ref={scrollRef} overflow={'scroll'}>
        <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('MessageType')}</Text>
        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={messageData.type} setSelectedItem={(value) => setMessageData((prev) => ({...prev, type: value}))} options={['generative', 'preespecified']} labelsMap={messagesTypeDict} />
        <Box bg='gray.300' width={'100%'} height={'1px'} mt='2vh' mb='2vh'/>

        {messageData.type === 'generative'? <>
        <Text color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('GenerationInstructions')}</Text>
        <Textarea mt='1vh'  maxLength={2000} height={'auto'} placeholder={`${t('VariableInstructionsPlaceholder')}...`} maxH='300px' value={messageData.generation_instructions} onChange={(e) => setMessageData((prev) => ({...prev, generation_instructions:e.target.value}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
        </>:
            <Box>
            {Object.keys(messageData.preespecified_messages).map((lng, index) => (
                <Box mt='15px' key={`message-${index}-${lng}`} gap='5px' alignItems={'center'}>
                    <Flex alignContent={'center'} justifyContent={'space-between'}> 
                        <Text color='gray.600' fontSize={'.8em'} mb='5px' fontWeight={'medium'}>{t('Language')}</Text>
                        <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => editMessagePreespecified(lng, 'remove')}/>
                    </Flex>
                    <Text fontSize={'.9em'} mb='5px' >{languagesFlags[lng][0]} {languagesFlags[lng][1]}</Text>
                    <Text color='gray.600'fontSize={'.8em'} mt='15px' fontWeight={'medium'}>{t('Message')}</Text>
                    <Textarea mt='5px'  maxLength={2000} height={'auto'} placeholder={`${t('WriteMessage')}...`} maxH='300px' value={messageData.preespecified_messages[lng]} onChange={(e) => editMessagePreespecified(lng, 'edit', e.target.value)} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                </Box>
            ))}
            <Button ref={buttonRef} size='sm' mt='2vh' onClick={() => setShowLanguagesFlags(!showLanguagesBox)} leftIcon={<FaPlus/>}>{t('AddLanguage')}</Button>
            <AnimatePresence> 
                {showLanguagesBox && 
                <Portal>
                    <MotionBox initial={{ opacity: 0, marginTop: boxPosition === 'bottom'?-10:10 }} animate={{ opacity: 1, marginTop: 0 }}  exit={{ opacity: 0,marginTop: boxPosition === 'bottom'?-10:10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                    top={boxStyle.top} bottom={boxStyle.bottom}right={boxStyle.right} width={boxStyle.width} maxH='40vh' overflow={'scroll'} gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000} position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                        {availableLanguage.map((option:string, index:number) => (
                            <Flex key={`option-${index}`} px='10px'  py='7px' cursor={'pointer'} justifyContent={'space-between'} alignItems={'center'} _hover={{bg:'brand.hover_gray'}}
                            onClick={() => {setShowLanguagesFlags(false);editMessagePreespecified(option, 'add')}}>
                                <Flex gap='10px' alignItems={'center'} > 
                                        <Text>{languagesFlags[option][0]} {languagesFlags[option][1]}</Text>
                                </Flex>
                                </Flex>
                        ))}
                    </MotionBox>
                </Portal>
            }
        </AnimatePresence>
        </Box>}
    </Box>)
}