//REACT
import { useState, useEffect, useRef, RefObject, useMemo, CSSProperties, Dispatch, SetStateAction, useLayoutEffect } from 'react'
import { useAuth } from '../../../AuthContext.js'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from '../../API/fetchData'
//FRONT
import { Flex, Box, Button, IconButton, NumberInput, NumberInputField, Text, Textarea, Portal, Icon } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//FLOWS
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, ControlButton, SelectionMode, Edge, useReactFlow } from 'reactflow'
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
import LoadingIconButton from '../../Components/LoadingIconButton.js'
import ConfirmBox from '../../Components/ConfirmBox.js'
//FUNCTIONS
import useOutsideClick from '../../Functions/clickOutside.js'
import determineBoxStyle from '../../Functions/determineBoxStyle.js'
//ICONS
import { RxCross2 } from 'react-icons/rx'
import { FaPlus, FaBuilding } from 'react-icons/fa'
import { IoIosArrowDown, IoIosWarning } from 'react-icons/io'
import { BsTrash3Fill } from 'react-icons/bs'
//TYPING
import { languagesFlags, Channels, actionTypesDefinition, nodeTypesDefinition, DataTypes, Branch, FlowMessage, FieldAction, ContactBusinessesTable, FunctionType } from '../../Constants/typing.js'
 
//FLOWS AND NODES DEFINITIONS
const panOnDrag = [1, 2]
 
//VARIABLE TYPES
type VariableType = {name:string, type:DataTypes, description:string, examples:any[], values:any[], ask_for_confirmation:boolean}

//MOTION BOX
const MotionBox = motion(Box)

//MAIN FUNCTION
const Flow = () => {

    const nodeTypes = useMemo(() => ({
        trigger: FirstNode,
        add: AddNode,
        brancher: BrancherNode,
        extractor: ExtactorNode,
        sender: SenderNode,
        terminator: TerminatorNode,
        transfer: TransferNode,
        reset: ResetNode,
        flow_swap: FlowSwapNode,
        function: FunctionNode,
        motherstructure_updates: MotherStructureUpdateNode
    }), [])

    const edgeTypes = useMemo(() => ({custom: CustomEdge}), [])

    const { zoomIn, zoomOut, setCenter } = useReactFlow()

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

    //BOOLEAN FOR WAIT THE CHARGE
    const [waiting, setWaiting] = useState<boolean>(true)

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
    const [flowsFunctions, setFlowFunctions] = useState<string[]>([])
    const functionsNameMap = useRef<{[key:string]:string}>({})
    const functionsArgsMap = useRef<{[key:string]:string[]}>({})
    const functionsOutputsMap = useRef<{[key:string]:string[]}>({})

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
                    case 'brancher': return  {setShowNodesAction, editBranch, addNewNode, deleteNode, getAvailableNodes}
                    case 'extractor': return {setShowNodesAction, editBranch, editExtractor, addNewNode, deleteNode, getAvailableNodes}
                    case 'sender': return {setShowNodesAction, editMessage, addNewNode, deleteNode, getAvailableNodes}
                    case 'terminator': return {setShowNodesAction, editMessage, deleteNode}
                    case 'transfer': return {setShowNodesAction, editMessage, editSimpleFlowData, deleteNode}
                    case 'reset': return {setShowNodesAction, editMessage, deleteNode, getAvailableNodes}
                    case 'flow_swap': return {flowsIds:[], setShowNodesAction, editMessage, addNewNode, deleteNode}
                    case 'function': return {functionsDict:functionsNameMap.current, setShowNodesAction, editSimpleFlowData, addNewNode, deleteNode, getAvailableNodes}
                    case 'motherstructure_updates': return {setShowNodesAction, editFieldAction, addNewNode, deleteNode, getAvailableNodes}

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

    //GET THE AVAILABLE NODES WHEN ADDING A NEW ONE
    const getAvailableNodes = (sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}) => {

        let availableNodes:string[] = []
        setNodes((nds) => {
            const [sourceX] = sourceData.sourceId.split('-').map(Number);
            const nextColumnNodes = nds.filter(node => {
                const [x] = node.id.split('-').map(Number)
                return x === sourceX + 1
            }).map((node, index) => {return node.id})

            if (sourceData.sourceId === 'reset') {
                const extractorNodes = nds.filter(node => node.type === 'extractor').map((node, index) => {return node.id})
                availableNodes = [...nextColumnNodes, ...extractorNodes]
            }
            else availableNodes = nextColumnNodes
            return nds
        })
        return availableNodes
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
    const addNewNode = (sourceData:{sourceId:string, sourceType:nodeTypesDefinition, branchIndex?:number}, targetType:nodeTypesDefinition | '', nodeId?:string) => {
   
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
            if (type === 'brancher') newNodeObjectData = {branches:[{name:'',conditions:[], next_node_index:null}], functions:{setShowNodesAction, editBranch, addNewNode, deleteNode, getAvailableNodes}}
            else if (type === 'extractor') newNodeObjectData = {branches:[], variables:[], functions:{flowVariables:flowVariablesRef.current, setShowNodesAction, editBranch, editExtractor, addNewNode, deleteNode, getAvailableNodes}}
            else if (type === 'sender') newNodeObjectData =  {next_node_index:null, messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, addNewNode, deleteNode, getAvailableNodes}}
            else if (type === 'terminator') newNodeObjectData = {flow_result:'', messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, deleteNode}}
            else if (type === 'transfer') newNodeObjectData = {user_id:0, group_id:0, messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, editSimpleFlowData, deleteNode}}
            else if (type === 'reset') newNodeObjectData = {messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{setShowNodesAction, editMessage, deleteNode, getAvailableNodes}}
            else if (type === 'flow_swap') newNodeObjectData = {new_flow_uuid:'-1', messages:[{type:'generative', generation_instructions:'', preespecified_messages:{}}], functions:{flowsIds:[], setShowNodesAction, editMessage, addNewNode, deleteNode}}
            else if (type === 'function') newNodeObjectData = {uuid:'', variable_args:{}, motherstructure_args:{}, hardcoded_args:{}, error_nodes_ids:{}, success_node_id:null, output_to_variables:{}, functions:{functionsDict:functionsNameMap.current, setShowNodesAction, editSimpleFlowData, addNewNode, deleteNode, getAvailableNodes}}
            else if (type === 'motherstructure_updates') newNodeObjectData = {updates:[], next_node_index:null, functions:{setShowNodesAction, editFieldAction, addNewNode, deleteNode, getAvailableNodes}}

            return {id, position, data: newNodeObjectData, type:targetType}
        }

        if (sourceData.sourceType === 'add') {
            setNodes((nds) => {
                    const newNodeObject = getNewNodeObject('1-0-1', targetType as nodeTypesDefinition, nds)
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
                if (sourceData.sourceType === 'brancher' || sourceData.sourceType === 'extractor' || sourceData.sourceType === 'function' ) {
                    const nodeIndex = nds.findIndex(node => node.id === sourceData.sourceId)
                    if (nodeIndex !== -1) {
                        const nodeToUpdate = { ...nds[nodeIndex] }

                        if (sourceData.sourceType === 'function') {
                            if (nodeToUpdate.data.error_nodes_ids) {
                                const updatedErrors = {...nodeToUpdate.data.error_nodes_ids}
                                const keyToUpdate = Object.keys(updatedErrors)[sourceData?.branchIndex as number]
                                if (keyToUpdate) {
                                    updatedErrors[keyToUpdate] = newNodeId
                                    nodeToUpdate.data = { ...nodeToUpdate.data, error_nodes_ids: updatedErrors };
                                }
                            }
                        }
                        else {
                            if (nodeToUpdate.data && Array.isArray(nodeToUpdate.data.branches)) {
                                const updatedBranches = nodeToUpdate.data.branches.map((branch:any, index:number) => {
                                    if (index === sourceData.branchIndex) return {...branch, next_node_index: newNodeId}
                                    return branch
                                })
                                nodeToUpdate.data = {...nodeToUpdate.data, branches: updatedBranches}
                            }
                        }
                        const updatedNodes = nds.map((node, index) => index === nodeIndex ? nodeToUpdate : node)
                        
                        if (nodeId) return updatedNodes
                        else return [...updatedNodes, getNewNodeObject(newNodeId, targetType as nodeTypesDefinition, nds)]
                    }
                }
                else {
                    const nodeIndex = nds.findIndex(node => node.id === sourceData.sourceId)
                    if (nodeIndex !== -1) {
                        const nodeToUpdate = { ...nds[nodeIndex], data:{...nds[nodeIndex].data, next_node_index:newNodeId} }
                        const updatedNodes = nds.map((node, index) => index === nodeIndex ? nodeToUpdate : node)
                        return [...updatedNodes, getNewNodeObject(newNodeId, targetType as nodeTypesDefinition, nds)]
                    }
                }
                if (nodeId) return nds
                else return [...nds, getNewNodeObject(newNodeId, targetType as nodeTypesDefinition, nds)]
            })

            setEdges((edges) => [...edges,  {id:`${sourceData.sourceId}->${nodeId?nodeId:newNodeId}(${sourceData?.branchIndex === undefined?'-1':sourceData?.branchIndex})`,sourceHandle:(sourceData?.branchIndex !== undefined)?`handle-${sourceData.branchIndex}`:'', type:'custom', source:sourceData.sourceId, target:nodeId?nodeId:newNodeId}])
        }
    }
    const deleteNode = (sourceId:string, resize?:boolean, delete_branch?:boolean) => {
        
        const resizeNodes = (nds:any[]) => {
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

                else if (resize) return resizeNodes(nds)
            
                else if (nds.length === 2) 
                {
                    setEdges([{ id: '0->1', type: 'custom', source: '0', target: '1' }])
                    return [{id:'0', position:{x:0, y:0}, data:{channels:[], setChannels}, type:'trigger'}, {id:'1', position:{x:350, y:0}, data:{addNewNode}, type:'add'}]   
                } 
                else {
                    let sourceNode:string = ''
                    let sourceHandle:number = -1

                    setEdges((edg) => edg.filter((edge) => {
                            const edgeSource = edge.id.split('->')[0]
                            const edgeTarget = edge.id.split('->')[1].split('(')[0]
                            sourceNode = edgeSource
                            if (edge.sourceHandle) {
                                if (edgeTarget === sourceId) sourceHandle = parseInt(edge.sourceHandle.split('-')[1])
                                return edgeTarget !== sourceId
                            }
                            return edgeSource !== sourceId && edgeTarget !== sourceId
                    }))

                    let updatedNodes = nds.map((node) => {
                        if (node.id === sourceNode ) {
                            if (sourceHandle !== -1) {
                                if (node.type === 'function') {
                                    const updatedErrors = { ...node.data.error_nodes_ids }
                                    const keyToUpdate = Object.keys(updatedErrors)[sourceHandle]
                                    if (keyToUpdate) updatedErrors[keyToUpdate] = null                                           
                                    return {...node, data: {...node.data, error_nodes_ids:updatedErrors}}
                                }
                                else {
                                    return {...node, data: {...node.data, branches: node.data.branches.map((branch: any, idx: number) => {
                                                if (idx === sourceHandle) return { ...branch, next_node_index: null }
                                                return branch
                                            })
                                        }
                                    }
                                }
                            }
                            else return {...node, data: {...node.data, next_node_index: null}} 
                        }
                        return node
                    })
                    updatedNodes = updatedNodes.filter((node) => node.id !== sourceId)
                    
                    return resizeNodes(updatedNodes)
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

    //ADD OR DELETE A MESSAGE IN SENDER
    const editFieldAction = (nodeId:string | undefined, index:number | undefined, type:'remove' | 'add' | 'edit', newAction?:FieldAction) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            let updatedActions
            if (type === 'remove') updatedActions = node.data.updates.filter((_:any, idx:number) => idx !== index)
            else if (type === 'add') updatedActions = [...node.data.updates, {motherstructure:'tickets', is_customizable:false, name:'user_id', op:'set', value:-1}]
            else if (type === 'edit') {
                updatedActions = node.data.updates.map((message: any, idx: number) => {
                  if (idx === index) return newAction
                  return message
                })
            }
            return {...node, data: { ...node.data, updates: updatedActions}}
        })
      ) 
    }

    //EDIT SIMPLE FLOW DATA
    const editSimpleFlowData = (nodeId:string | undefined, keyToEdit:string, newData:any ) => {
        
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            return {...node, data: { ...node.data, [keyToEdit]: newData}}
        }))
    }

    //EDIT FUNCTION DATA 
    const editFunctionFlowData = (nodeId:string | undefined, newData:any ) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            return {...node, data: { functions:node.data.functions, ...newData}}
        }))
    }

    const findLastExtractor = (nodeId:string) => {

        let lastExtractorVariables: number[] = []

        function findPreviousNode(nodeId: string, nodes: any[], edges: Edge[]): string | null {
            const edge = edges.find(e => e.id.split('->')[1] === nodeId)
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
            
            const responseFunctions = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients`, setWaiting, auth })
            
            //CAMBIAR LÓGICA, AHORA ESTOY FALSEANDO
            if (responseFunctions?.status === 200) {
                //const functionsList = responseFunctions.data
                const functionsList = [{name:'Función 1', uuid:'orjenojv-edkv4refv-r4vf4rev-dewewd', args:['num_pedido', 'anyo', 'tienda'], output:['status', 'date']}]

                const UUIDsList = functionsList.map((item:any) => item.uuid)
                const dictName = functionsList.reduce((acc:any, item:any) => {
                    acc[item.uuid] = item.name
                    return acc
                }, {})
                const dictArgs = functionsList.reduce((acc:any, item:any) => {
                    acc[item.uuid] = item.args
                    return acc
                }, {})
                const dictOutputs = functionsList.reduce((acc:any, item:any) => {
                    acc[item.uuid] = item.output
                    return acc
                }, {})
        
                setFlowFunctions(UUIDsList)
                functionsNameMap.current = dictName
                functionsArgsMap.current = dictArgs
                functionsOutputsMap.current = dictOutputs
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

        const structureList:('ticket' | 'client' | 'contact_business')[] = ['ticket', 'client', 'contact_business']    
        const structureLabelsMap:{[key in 'ticket' | 'client' | 'contact_business']:string} = {'ticket':t('tickets'), 'client':t('clients'),'contact_business':t('contact_businesses')}
        const ticketsList = ['user_id', 'group_id', 'channel_type', 'title', 'subject', 'urgency_rating', 'status', 'unseen_changes', 'tags', 'is_matilda_engaged', 'is_satisfaction_offered']
        const ticketsLabelsMap:{[key:string]:string} = {}
        ticketsList.forEach((structure, index) => {ticketsLabelsMap[structure] = t(structure)})
        const clientsList = ['contact_business_id', 'name', 'language', 'rating', 'notes', 'labels']
        const structureClientsMap:{[key:string]:string} = {}
        clientsList.forEach((structure, index) => {structureClientsMap[structure] = t(structure)})
        const businessList = ['name', 'domain', 'notes', 'labels']
        const structureBusinessMap:{[key:string]:string} = {}
        businessList.forEach((structure, index) => {structureBusinessMap[structure] = t(structure)})

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
                    <Box ref={scrollRef} overflow={'scroll'}  p='30px'>
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
                <Box ref={scrollRef} overflow={'scroll'}  p='30px'>
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
                    {messageData.require_confirmation && <>
                        <Text  mt='2vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('ConfirmationMessage')}</Text>
                        <EditMessage scrollRef={scrollRef} messageData={confirmationMessage} setMessageData={setConfirmationMessage}/>
                    </>}
                    </>}
                </Box>)
            }

            case 'message': {

                const [messageData, setMessageData] = useState<FlowMessage>(node?.data.messages[showNodesAction?.actionData.index])
                useEffect(()=> {
                    editMessage(showNodesAction?.nodeId, showNodesAction?.actionData.index, 'edit', messageData)
                },[messageData])
       
                return (
                <Box ref={scrollRef} overflow={'scroll'}  p='30px'>
                    <EditMessage scrollRef={scrollRef} messageData={messageData} setMessageData={setMessageData}/>
                </Box>)
            }

            case 'flow_result':
                const [flowResult, setFlowResult] = useState<string>(node?.data.flow_result)
                useEffect(()=> {
                    editSimpleFlowData(showNodesAction?.nodeId, 'flow_result', flowResult)
                },[flowResult])

                return(
                <Box ref={scrollRef} overflow={'scroll'}  p='30px'>
                    <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('FlowResult')}</Text>
                    <Textarea mt='5px'  maxLength={2000} height={'auto'} placeholder={`${t('FlowResultPlaceholder')}...`} maxH='300px' value={flowResult} onChange={(e) => setFlowResult(e.target.value)} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>
                </Box>
                )

            case 'edit_fields':

                //BOOLEAN FOR NOT CHANGING THE VALUE ON FIRST RENDER
                const firstRender = useRef<boolean>(true)

                //MAPPING CONSTANTS
                const operationTypesDict = {'user_id':['set'], 'group_id':['set'], 'channel_type':['set'], 'title':['set', 'concatenate'], 'subject':['set'], 'urgency_rating':['set', 'add', 'substract'], 'status':['set'], 'unseen_changes':['set'], 'tags':['append', 'remove'], 'is_matilda_engaged':['set'],'is_satisfaction_offered':['set'],
                'contact_business_id':['set'], 'name':['set', 'concatenate'], 'language':['set'], 'rating':['set', 'add', 'substract'], 'notes':['set', 'concatenate'], 'labels':['append', 'remove'],
                'domain':['set', 'concatenate']
                }
                const operationLabelsMap = {'set':t('set'), 'add':t('add'), 'substract':t('substract'), 'concatenate':t('concatenate'), 'append':t('append'), 'remove':t('remove')}

                //FETCH DATA LOGIC
                const [fieldsData, setFieldsData] = useState<FieldAction>(node?.data.updates[showNodesAction?.actionData.index])
                useEffect(()=> {
                    editFieldAction(showNodesAction?.nodeId, showNodesAction?.actionData.index, 'edit', fieldsData)
                },[fieldsData])

                //NAMES TO SELECT ON CHANGE MOTHERSTRUCTURE
                const selectableNames = fieldsData.motherstructure === 'ticket' ? ticketsList : fieldsData.motherstructure === 'client' ? clientsList : businessList
                const selectableDict = fieldsData.motherstructure === 'ticket' ? ticketsLabelsMap : fieldsData.motherstructure === 'client' ? structureClientsMap : structureBusinessMap
                useEffect(()=> {
                    if (firstRender.current === false) setFieldsData((prev) => ({...prev, value:''}))
                    else firstRender.current = false 
                },[fieldsData.name])

                return(
                    <Box ref={scrollRef} overflow={'scroll'}  p='30px'>
         
                        <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('StructureUpdate')}</Text>
                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={fieldsData.motherstructure} setSelectedItem={(value) => setFieldsData((prev) => ({...prev, motherstructure:value}))} options={structureList} labelsMap={structureLabelsMap} />
                        <Text mt='1vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('IsCustomizable')}</Text>
                        <Flex gap='10px' mt='5px'>
                            <Button bg={fieldsData.is_customizable?'brand.gradient_blue':'gray.200'} color={fieldsData.is_customizable?'white':'black'} size='sm' _hover={{bg:fieldsData.is_customizable?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setFieldsData((prev) => ({...prev, is_customizable:true}))}>{t('Yes')}</Button>
                            <Button bg={!fieldsData.is_customizable?'brand.gradient_blue':'gray.200'} color={!fieldsData.is_customizable?'white':'black'} size='sm' _hover={{bg:!fieldsData.is_customizable?'brand.gradient_blue_hover':'gray.300'}} onClick={() => setFieldsData((prev) => ({...prev, is_customizable:false}))}>{t('No')}</Button>
                        </Flex> 
                        <Text mt='1vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('ActionDefinition')}</Text>
                        {fieldsData.is_customizable? <Text></Text>:
                        
                        <Flex alignItems={'center'} gap='10px'>
                            <Box flex='1'> 
                                <CustomSelect containerRef={scrollRef} hide={false} selectedItem={fieldsData.op} setSelectedItem={(value) => setFieldsData((prev) => ({...prev, op:value}))} options={(operationTypesDict[fieldsData.name as keyof typeof operationTypesDict] || [])} labelsMap={operationLabelsMap} />
                            </Box>
                            <Box flex='1'> 
                                <CustomSelect containerRef={scrollRef} hide={false} selectedItem={fieldsData.name} setSelectedItem={(value) => setFieldsData((prev) => ({...prev, name:value}))} options={selectableNames} labelsMap={selectableDict} />
                            </Box>
                            <Text>{t(`${fieldsData.op}_2`)}</Text>
                            <Box flex='1'> 
                                <VariableTypeComponent inputType={fieldsData.name} value={fieldsData.value} setValue={(value) => setFieldsData((prev) => ({...prev, value}))}/>
                            </Box>
                        </Flex>}
                    </Box>
                )

            case 'function':
   
                //BOOLEAN FOR NOT CHANGING THE VALUE ON FIRST RENDER
                const firstRender2 = useRef<boolean>(true)

                //FLOW VARIABLES MAP
                const variablesLabelsMap:{[key:number]:string} = {}
                flowVariables.forEach((variable, index) => {variablesLabelsMap[index] = t(flowVariables[index].name)})

                //CONVERTING THE NDOE DATA TO MANIPULATE IT
                const { functions, ...rest } = node?.data 
                const [functionData, setFunctionData] = useState<FunctionType>(rest)

                useEffect(()=> {editFunctionFlowData(showNodesAction?.nodeId, functionData)},[functionData])

                //SELECTABLE ARGS, BASED ON THE FUNCTGION UUID AND THE ARGS THAT ARE ALREADY SELECTED 
                const [argsToSelect, setArgsToSelect] = useState<string[]>([])
                const [outputsToSelect, setOutputsToSelect] = useState<string[]>([])

                useEffect(()=> {
                    if (firstRender2.current === false) {
                        setArgsToSelect(functionsArgsMap.current[functionData.uuid])
                        setOutputsToSelect(functionsOutputsMap.current[functionData.uuid])
                        setFunctionData({uuid:functionData.uuid, variable_args:{}, motherstructure_args:{}, hardcoded_args:{}, error_nodes_ids:{}, next_node_index:null, output_to_variables:{}})
                    }
                    else firstRender2.current = false
                },[functionData.uuid])

                //SELECTABLE ARGUMENTS AND OUTPUTS
                const selectedArgs = Object.keys(functionData.variable_args).concat(Object.keys(functionData.motherstructure_args)).concat(Object.keys(functionData.hardcoded_args))
                let selectableArgs:string[]  = []
                if (functionData.uuid !== '' && argsToSelect !== undefined) selectableArgs = argsToSelect.filter(arg => !selectedArgs.includes(arg))
                const selectedOutputs = Object.keys(functionData.output_to_variables)
                let selectableOutputs:string[]  = []
                if (functionData.uuid !== '' && outputsToSelect !== undefined) selectableOutputs = outputsToSelect.filter(arg => !selectedOutputs.includes(arg))

                //FUNCTION FOR EDITING ARGS
                const editArg = (argType:'variable_args' | 'motherstructure_args' | 'hardcoded_args' | 'output_to_variables', type:'add' | 'edit' | 'remove', argKey?:string,  newValue?:any) => {
                    
                    if (type === 'add' && (argType === 'output_to_variables'?selectableOutputs:selectableArgs).length > 0) {
                        setFunctionData((prev) => ({...prev, [argType]: {...prev[argType], [(argType === 'output_to_variables'?selectableOutputs:selectableArgs)[0]]: argType === 'motherstructure_args' ? { motherstructure: 'ticket', is_customizable: false, name: 'user_id' }: -1 }}))
                    } 
                    else if (type === 'remove' && argKey !== undefined) {
                        setFunctionData((prev) => {
                            const updatedArgType = { ...prev[argType] }
                            delete updatedArgType[argKey]
                            return {...prev, [argType]: updatedArgType}
                        })
                    }
                    else if (type === 'edit'  && argKey !== undefined   && newValue !== undefined) {
                        setFunctionData((prev) => {
                            const updatedArgType = { ...prev[argType] }
                            updatedArgType[argKey] = newValue
                            return {...prev, [argType]: updatedArgType}
                        })
                    }

                }   

                //BUTTON FOR ADDING A NEW ARG
                const AddArgButton = ({argType}:{argType:'variable_args' | 'motherstructure_args' | 'hardcoded_args' | 'output_to_variables'}) => {

                    //SHOW AND HIDE BOX LOGIC
                    const boxRef = useRef<HTMLDivElement>(null)
                    const buttonRef = useRef<HTMLButtonElement>(null)
                    const [showAdd, setShowAdd] = useState<boolean>(false)
                    useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef:scrollRef, onOutsideClick:setShowAdd})
                    const [boxPosition, setBoxPosition] = useState<'top' | 'bottom'>('bottom')
                    const [boxStyle, setBoxStyle] = useState<CSSProperties>({})
                    determineBoxStyle({buttonRef, setBoxStyle, setBoxPosition, changeVariable:showAdd})
                    
                    //FRONT
                    return (
                        <Flex mt='2vh' flexDir={'row-reverse'}>
                            <Button ref={buttonRef} onClick={() => setShowAdd(true)} leftIcon={<FaPlus/>} size={'sm'}>{argType === 'output_to_variables' ? t('AddOutput'):t('AddArg')}</Button> 
                            <AnimatePresence> 
                                {showAdd && 
                                <Portal>
                                    <MotionBox initial={{ opacity: 0, marginTop: boxPosition === 'bottom'?-10:10 }} animate={{ opacity: 1, marginTop: 0 }}  exit={{ opacity: 0,marginTop: boxPosition === 'bottom'?-10:10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                                    top={boxStyle.top} bottom={boxStyle.bottom}right={boxStyle.right} width={boxStyle.width} maxH='40vh' overflow={'scroll'} gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000} position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                                        {(argType === 'output_to_variables' ? selectableOutputs:selectableArgs).map((arg, index) => (
                                            <Flex p='5px' _hover={{bg:'brand.hover_gray'}} key={`arg-${index}`} onClick={() => {setShowAdd(false);editArg(argType, 'add')}}>
                                                <Text fontSize={'.9em'}>{arg}</Text>
                                            </Flex>
                                        ))}
                                    </MotionBox>
                                </Portal>
                            }
                        </AnimatePresence>
                        </Flex>

                    )
                }

                //COMPONENT FOR THE MOTHERSTRUCTURE ARGS
                const MotherStructureArg = ({selectedArg, keyToEdit}:{selectedArg:{motherstructure:'ticket' | 'client' | 'contact_business',is_customizable:boolean, name:string}, keyToEdit:string}) => {

                    const selectableNames2 = selectedArg.motherstructure === 'ticket' ? ticketsList : selectedArg.motherstructure === 'client' ? clientsList : businessList
                    const selectableDict2 = selectedArg.motherstructure === 'ticket' ? ticketsLabelsMap : selectedArg.motherstructure === 'client' ? structureClientsMap : structureBusinessMap
    
                
                    return (
                    <> 
                        <Text mb='.5vh' mt='1vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('StructureUpdate')}</Text>
                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={selectedArg.motherstructure} setSelectedItem={(value) => editArg('motherstructure_args', 'edit', keyToEdit, {...functionData.motherstructure_args[keyToEdit], motherstructure:value})} options={structureList} labelsMap={structureLabelsMap} />

                        <Text mt='1vh'  mb='.5vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('IsCustomizable')}</Text>
                        <Flex gap='10px' >
                            <Button bg={selectedArg.is_customizable?'brand.gradient_blue':'gray.200'} color={selectedArg.is_customizable?'white':'black'} size='xs' _hover={{bg:selectedArg.is_customizable?'brand.gradient_blue_hover':'gray.300'}} onClick={() => editArg('motherstructure_args', 'edit', keyToEdit, {...functionData.motherstructure_args[keyToEdit], is_customizable:true})} >{t('Yes')}</Button>
                            <Button bg={!selectedArg.is_customizable?'brand.gradient_blue':'gray.200'} color={!selectedArg.is_customizable?'white':'black'} size='xs' _hover={{bg:!selectedArg.is_customizable?'brand.gradient_blue_hover':'gray.300'}} onClick={() => editArg('motherstructure_args', 'edit', keyToEdit, {...functionData.motherstructure_args[keyToEdit], is_customizable:false})} >{t('No')}</Button>
                        </Flex>
                        
                        <Text mb='.5vh' mt='1vh' color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('StructureName')}</Text>
                        {selectedArg.is_customizable? <Text></Text>: 
                            <CustomSelect containerRef={scrollRef} hide={false} selectedItem={functionData.motherstructure_args[keyToEdit].name} setSelectedItem={(value) => editArg('motherstructure_args', 'edit', keyToEdit, {...functionData.motherstructure_args[keyToEdit], name:value})}  options={selectableNames2} labelsMap={selectableDict2} />
                        }
                    </>)

                }
                
                return (
                    <Box ref={scrollRef} overflowY={'scroll'} p='30px'>
                        <Text mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('FunctionToSelect')}</Text>
                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={functionData.uuid} setSelectedItem={(value) => setFunctionData((prev) => ({...prev, uuid:value}))} options={flowsFunctions} labelsMap={functionsNameMap.current} />
                        
                        {functionData.uuid !== '' && <>
                            <Text mt='2vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('VariableArgs')}</Text>
                            {Object.keys(functionData.variable_args).map((keyToEdit, index) => (
                                <Flex mt='1vh' gap='20px' key={`variable-args-${index}`} alignItems={'center'}>
                                    <Text  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                                    <Box flex='2'> 
                                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={functionData.variable_args[keyToEdit]} setSelectedItem={(value) => editArg('variable_args', 'edit', keyToEdit, value )} options={Array.from({length: flowVariables.length}, (v, i) => i)} labelsMap={variablesLabelsMap} />
                                    </Box>
                                    <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-arg-1' onClick={() => editArg('variable_args', 'remove', keyToEdit)}/>
                                </Flex>
                                
                            ))}  
                            <AddArgButton argType={'variable_args'}/>

                            <Text mt='2vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('StructureArgs')}</Text>
                            {Object.keys(functionData.motherstructure_args).map((keyToEdit, index) => (
                                <Box  mt='1vh'  key={`motherstructure-args.${index}`} bg='white' borderRadius={'.5em'}  p='15px' boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.15)'}> 
                                    <Flex justifyContent={'space-between'} alignItems={'center'}> 
                                        <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                                        <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-arg-2' onClick={() => editArg('motherstructure_args', 'remove', keyToEdit)}/>
                                    </Flex>
                                    <MotherStructureArg selectedArg={functionData.motherstructure_args[keyToEdit]} keyToEdit={keyToEdit}/>
                                </Box>
                            ))}  
                            <AddArgButton argType={'motherstructure_args'}/>

                            <Text  mt='2vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('HarcodedArgs')}</Text>
                            {Object.keys(functionData.hardcoded_args).map((keyToEdit, index) => (
                                <Flex  mt='1vh'  gap='20px' key={`hardcoded-args-${index}`} alignItems={'center'}>
                                    <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                                    <Box flex='2'> 
                                        <EditText hideInput={false} value={functionData.hardcoded_args[keyToEdit]} setValue={(value:string) => editArg('hardcoded_args', 'edit', keyToEdit, value )}/>
                                    </Box>
                                    <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-arg-3' onClick={() => editArg('hardcoded_args', 'remove', keyToEdit)}/>
                                </Flex>
                            ))}    
                            <AddArgButton argType={'hardcoded_args'}/>

                            <Text  mt='2vh' mb='1vh'color='gray.600' fontSize={'.8em'} fontWeight={'medium'}>{t('OutputArgs')}</Text>
                            {Object.keys(functionData.output_to_variables).map((keyToEdit, index) => (
                                <Flex  mt='1vh'  gap='20px' key={`output-args-${index}`} alignItems={'center'}>
                                    <Text  whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'} flex='1' fontWeight={'medium'} >{keyToEdit}</Text>
                                    <Box flex='2'> 
                                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={functionData.output_to_variables[keyToEdit]} setSelectedItem={(value) => editArg('output_to_variables', 'edit', keyToEdit, value )} options={Array.from({length: flowVariables.length}, (v, i) => i)} labelsMap={variablesLabelsMap} />
                                    </Box>
                                    <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-output' onClick={() => editArg('output_to_variables', 'remove', keyToEdit)}/>
                                </Flex>
                            ))}    
                            <AddArgButton argType={'output_to_variables'}/>

                        </>}
                    </Box>)
                 
            default: return <></>
        
        }
    }

    //MEMOIZED NODE EDITOR
    const memoizedNodesEditor = useMemo(() => (
        <AnimatePresence> 
        {showNodesAction && <>
            <MotionBox initial={{right:-400}} animate={{right:0}}  exit={{right:-400}} transition={{ duration: .15 }} position='fixed' top={0} width='700px' height='100vh'  backgroundColor='white' zIndex={201} display='flex' justifyContent='space-between' flexDirection='column'> 
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

    //WARNIGNS COMPONENT
    const WarningsComponent = () => {

        //ICON REF
        const iconRef = useRef<HTMLDivElement>(null)

        //SHOW WARNINGS BOX LOGIC
        const [showWarningBox, setShowWarningBox] = useState<boolean>(false)
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const handleMouseEnter = () => {if (timeoutRef.current) clearTimeout(timeoutRef.current);setShowWarningBox(true)}
        const handleMouseLeave = () => {timeoutRef.current = setTimeout(() => {setShowWarningBox(false)}, 100)}

        //WARNINGS TYPES
        const [endWarning, setEndWarning] = useState<{id:string, type:nodeTypesDefinition}[]>([])
        const [aloneWarning, setAloneWarning] = useState<string[]>([])
        const [nodeWarning, setNodeWarning] = useState<{id:string, type:nodeTypesDefinition, warningData?:{branchIndex:number}}[]>([])

        //UPDATE DIFFERENT TYPES OF WARNINGS
        useLayoutEffect(() => {
            if (nodes[1].type !== 'add') {
                const maxCol = Math.max(...nodes.map(node => parseInt(node.id.split('-')[0])))
                const filteredNodes = nodes.filter(node => {
                    const colIndex = parseInt(node.id.split('-')[0])
                    return colIndex === maxCol
                })
                const result = filteredNodes.filter(node => !['terminator', 'transfer', 'flow_swap'].includes(node.type as nodeTypesDefinition)).map(node => ({ id: node.id, type: node.type as nodeTypesDefinition}))
                setEndWarning(result)
            }
        }, [nodes.length])
        useLayoutEffect(() => {
            if (nodes[1].type !== 'add') {
                const targetIds = new Set(edges.map(edge => edge.target))
                const isolatedNodes = nodes.filter(node => node.id !== '0' && !targetIds.has(node.id)).map(node => node.id)
                setAloneWarning(isolatedNodes)
            }
        }, [edges, nodes])
        useLayoutEffect(() => {
            let customNodesWarnings:{id:string, type:nodeTypesDefinition, warningData?:{branchIndex:number}}[] = []
            nodes.map((node) => {
                if (node.type === 'brancher' || node.type === 'extractor') {
                    if (flowVariables.length === 0) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition})
                    node.data.branches.map((branch:Branch, index:number) => {
                        if (branch.conditions.length === 0) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition, warningData:{branchIndex:index}})
                    })
                }
                else if (node.type === 'transfer' && node.data.group_id === null && node.data.user_id === null) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition})
                else if (node.type === 'reset' && flowVariables.length === 0) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition})
                else if (node.type === 'flow_swap' && node.data.new_flow_uuid === null) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition})
                else if (node.type === 'function' && node.data.uuid === null) customNodesWarnings.push({id:node.id, type:node.type as nodeTypesDefinition})
            })
            setNodeWarning(customNodesWarnings)
        }, [nodes, flowVariables.length])

        //ACTION ON CLICKNG A WARNING
        const clickWarning = (type:'navigate' | 'open-variables', nodeId?:string) => {
            if (type === 'navigate') {
                setShowWarningBox(false)
                if (nodes.length > 0) {
                    const node = nodes.find(node => node.id === nodeId)
                    if (node) {
                        const x = node.position.x + (node?.width || 0) / 2;
                        const y = node.position.y + (node?.height || 0) / 2;
                        setCenter(x, y, { zoom:1.5, duration: 500 })
                    }
                }
             }
            else if (type === 'open-variables') {setShowMoreInfo(true);setShowWarningBox(false)}

        }

        //OBTAIN THE TEXT MESSAGE OF EACH NODE WARNING
        const nodesWarningsTypes = (warningObject:{id:string, type:nodeTypesDefinition, warningData?:{branchIndex:number}}) => {

            const nodeId = warningObject.id.split('-')[2]
            switch (warningObject.type) {
                case 'brancher':
                case 'extractor': {
                    if (warningObject.warningData === undefined) return t('NoVariablesWarning', {id:nodeId})
                    else return t('BranchesWarning',  {id:nodeId, index:warningObject.warningData.branchIndex})
                }
                case 'transfer':
                    return t('NoTransferWarning', {id:nodeId})
                case 'reset':
                    return t('NoVariablesResetWarning', {id:nodeId})
                case 'flow_swap':
                    return t('NoFlowWarning', {id:nodeId})
                case 'transfer':
                    return t('NoTransferWarning', {id:nodeId})
                default: return ''
            }
        }

        //TOTAL NUMBER OF WARNINGS
        const numberOfWarnings = endWarning.length + aloneWarning.length + nodeWarning.length 


        return (<> 
            {numberOfWarnings > 0 && 
            <Flex position={'relative'} onMouseEnter={handleMouseEnter}  onMouseLeave={handleMouseLeave}  >   
                <Box p='2px' ref={iconRef} bg='gray.100' position='absolute' borderRadius={'13px'}   bottom={'-7px'} left={'17px'}> 
                    <Flex   justifyContent={'center'} alignItems={'center'} borderRadius={'11px'}  px='5px' height={'15px'}  color='white' bg='red'>
                        <Text fontSize={'.6em'} fontWeight={'bold'}>{numberOfWarnings}</Text>
                    </Flex>
                </Box>
                <Icon cursor={'pointer'} color='red' as={IoIosWarning} boxSize={'30px'}/>
                
                <AnimatePresence> 
                    {showWarningBox && (
                    <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}  transition={{ duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.1 }, scale: {duration: 0.1,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                    style={{ transformOrigin: 'top' }} width={`${window.innerWidth * 0.98 - (iconRef.current?.getBoundingClientRect().left || 0)}px`} maxH={'calc(100vh - 4vw - 45px)'} overflow={'scroll'}  position='absolute' bg='transparent' left={0}  top='45px' zIndex={1000}  borderRadius='.5rem' >
                        {endWarning.map((war, index) => (
                            <Flex onClick={() => clickWarning('navigate', war.id)}  cursor={'pointer'} key={`end-warning-${index}`} mt='10px' bg='white' borderWidth={'0px 0px 0px 5px'} borderColor={'#E53E3E'} p='10px' borderRadius={'.5rem'} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' >
                                <Text fontSize={'.8em'}>{t('EndWarning', {id:war.id.split('-')[2], type:war.type})}</Text>
                            </Flex>
                        ))} 
                        {aloneWarning.map((id, index) => (
                            <Flex onClick={() => clickWarning('navigate', id)}  cursor={'pointer'} key={`end-warning-${index}`} mt='10px' bg='white' borderWidth={'0px 0px 0px 5px'} borderColor={'#E53E3E'} p='10px' borderRadius={'.5rem'} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' >
                                <Text fontSize={'.8em'}>{t('AloneWarning', {id:id.split('-')[2]})}</Text>
                            </Flex>
                        ))} 
                        {nodeWarning.map((war, index) => {
                            const shouldOpenVariables = ((war.type === 'brancher' || war.type === 'extractor') && war?.warningData === undefined)
                            return(
                            <Flex onClick={() => clickWarning(shouldOpenVariables?'open-variables':'navigate', war.id)}  cursor={'pointer'} key={`end-warning-${index}`} mt='10px' bg='white' borderWidth={'0px 0px 0px 5px'} borderColor={'#E53E3E'} p='10px' borderRadius={'.5rem'} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.15)' >
                                <Text fontSize={'.8em'}>{nodesWarningsTypes(war)}</Text>
                            </Flex>)
                        })} 
                    </MotionBox>)}
                </AnimatePresence>
            </Flex>}
        </>)
    }
    //FRONT
    return (<>
        <Flex height={'100vh'} justifyContent={'center'} alignItems={'center'} width={'calc(100vw - 60px)'} flexDir={'column'} bg='white' backdropFilter='blur(1px)' >

            {waiting ? <LoadingIconButton/> :
            <> 
            <Box left={'1vw'} ref={nameInputRef} top='1vw' zIndex={100} position={'absolute'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.1)'} maxH={'calc(100vh - 2vw)'} overflow={'scroll'} bg='white' borderRadius={'.5rem'} borderWidth={'1px'} borderColor={'gray.300'} > 
                <Flex gap='10px' alignItems={'center'} p='10px'> 
                    <Box width={'300px'} > 
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
                <WarningsComponent/>
                <Button size='sm' bg='transparent' borderColor={'gray.300'} borderWidth={'1px'}>{t('Test')}</Button>
                <Button size='sm' bg='red.400' _hover={{bg:'red.500'}}  color='white'>{t('Close')}</Button>
                <Button size='sm' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} color='white'>{t('SaveChanges')}</Button>
            </Flex>


            <Box width={'100%'} height={'100%'}bg='gray.100' ref={flowBoxRef} >   
                <ReactFlow nodesDraggable={false} panOnScroll  panOnDrag={panOnDrag} selectionMode={SelectionMode.Partial} defaultViewport={{ x: 100, y: 200, zoom: 1 }}   nodes={nodes} nodeTypes={nodeTypes}  edgeTypes={edgeTypes} onNodesChange={onNodesChange} edges={edges} onEdgesChange={onEdgesChange}>
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
            </>}
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
        case 'float': return (
            <NumberInput value={value} onChange={(value) => setValue(inputType === 'float'?value:String(parseInt(value))) } min={1} max={1000000} clampValueOnBlur={false} >
                <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
            </NumberInput>)           
        case 'str':
        case 'list':
                return <EditText value={value} setValue={(value) => setValue(value) } hideInput={false} />
        case 'timestamp':
            return <CustomSelect hide={false} selectedItem={value}  setSelectedItem={(value) => setValue(value)}  options={Object.keys(datesMap)} labelsMap={datesMap}/>

        default: 
            return null
    }

} 

//COMPONENT FOR EDITING A MESSAGE
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

//SHOWING THE VALUE TYPE DEPENDING ON THE VATIABLE TO EDIT IN MOTHERSTRUCTURE
const VariableTypeComponent = ({inputType, value, setValue}:{inputType:string, value:any, setValue:(value:any) => void}) => {
    
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
        case 'rating': return (
            <NumberInput value={value} onChange={(value) => setValue(value)} min={1} max={5} clampValueOnBlur={false} >
                <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
            </NumberInput>)
        default: 
            return null
    }

} 

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