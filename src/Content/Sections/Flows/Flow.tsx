//REACT
import { useState, useCallback, useEffect, useRef, RefObject } from 'react'
import { useAuth } from '../../../AuthContext.js'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from '../../API/fetchData'
//FRONT
import { Flex, Box, Button, Text, IconButton, Icon, Tooltip, Grid, NumberInput, NumberInputField } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
//FLOWS
import ReactFlow, { Controls, Background, useNodesState, useEdgesState} from 'reactflow'
import 'reactflow/dist/style.css'
import { FirstNode } from './CustomNodes'
import { AddNode } from './CustomNodes'
import { BrancherNode } from './CustomNodes'
import { ExtactorNode } from './CustomNodes'
import { CustomEdge } from './CustomNodes'
//COMPONENTS
import EditText from '../../Components/EditText.js'
import CustomSelect from '../../Components/CustomSelect.js'
//ICONS
import { RxCross2 } from 'react-icons/rx'
import { FaPlus } from 'react-icons/fa'

//TYPING
import { languagesFlags, Channels, actionTypesDefinition, nodeTypesDefinition, DataTypes } from '../../Constants/typing.js'

const nodeTypes = {
    trigger: FirstNode,
    add:AddNode,
    brancher:BrancherNode,
    extractor:ExtactorNode,
}
const edgeTypes = { custom: CustomEdge }

const Flow = () => {

    //TRANSLATION
    const { t } = useTranslation('flows')

    //CONSTANTS
    const auth = useAuth()
    const location = useLocation().pathname
  
    //MOTION BOX
    const MotionBox = motion(Box)

    //REFS AND BAR PROPS
    const flowBoxRef = useRef<HTMLDivElement>(null)
    const nameInputRef = useRef<HTMLDivElement>(null)

    //TRACK EACH COLUMNS
    const [columnsIndexes, setColumnIndexes] = useState<string[][]>([])

    //SHOW NODES EDITOR
    const [showNodesAction, setShowNodesAction] = useState<null | {nodeId:string, actionType:actionTypesDefinition, actionData:any}>(null)

    //FLOW DATA
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [flowName, setFlowName] = useState<string>(t('NewFlow'))    

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
   
        if (sourceData.sourceType === 'add') {
            setNodes((nds) =>
                {
                    let newNodeObject:any
                    if (targetType === 'brancher') newNodeObject = {id:String(nds.length - 1), position:{x:350, y:0}, data:{branches:[{name:'',conditions:[], next_node_index:null}], setShowNodesAction, editBranch, deleteNode}, type:targetType, dragging:false,deletable:false, draggable:false}
                    else if (targetType === 'extractor') newNodeObject = {id:String(nds.length - 1), position:{x:350, y:0}, data:{branches:[], variables:[], setShowNodesAction, editBranch, editExtractor, deleteNode}, type:targetType, dragging:false,deletable:false, draggable:false}
            
                    setColumnIndexes((cols) => {
                        let newColumns = [...cols];
                        let sourceColumnIndex = -1;
            
                        // Encontrar la columna del nodo fuente
                        cols.forEach((col, index) => {
                            if (col.includes(sourceData.sourceId)) {
                                sourceColumnIndex = index;
                            }
                        });
            
                        // Determinar la columna donde colocar el nuevo nodo
                        let targetColumnIndex = sourceColumnIndex + 1;
            
                        // Si no existe la columna destino, crearla
                        if (targetColumnIndex >= newColumns.length) {
                            newColumns.push([]);
                        }
            
                        // Agregar el nuevo nodo a la columna correcta
                        newColumns[targetColumnIndex] = [...newColumns[targetColumnIndex], newNodeId];
            
                        return newColumns;
                    });

                    return nds.map((node) => {
                        if (node.id !== '1') return node
                        return newNodeObject
                    })
                }
            )
        }
    }
    const deleteNode = (sourceId:string) => {
        setNodes((nds) => 
            {
                if (nds.length === 2) {
                    return [
                        {id:'0', position:{x:0, y:0}, data:{channels:[], setChannels}, type:'trigger', dragging:false, deletable:false, draggable:false},
                        {id:'1', position:{x:300, y:0}, data:{addNewNode}, type:'add', dragging:false, deletable:false, draggable:false}
                    ]
                }
                setColumnIndexes((cols) => {
                    // Remover el nodo de la columna
                    let updatedColumns = cols.map(col => col.filter(id => id !== sourceId));
        
                    // Eliminar columnas vacías si es necesario
                    updatedColumns = updatedColumns.filter(col => col.length > 0);
        
                    return updatedColumns;
                });
        
                return nds.filter((node) => node.id !== sourceId)
            }
        )}

     

    //EDIT A CONDITION FROM A BRANCH
    const editBranchConditions = (nodeId:string | undefined, index:number | undefined, newConditions?:{variable_index:number, op:string, value:any}[], type?:'add' | 'remove' | 'edit') => {
        setNodes((nds) => nds.map((node) => {
          if (node.id !== nodeId) return node 
          return {
            ...node,
            data: {
              ...node.data,
              branches: node.data.branches.map((branch:any, idx:number) => {
                if (idx !== index) return branch
                if (type === 'edit' || type === undefined) return {...branch, conditions: newConditions}
                else if (type === 'remove') {
                    const updatedConditions = branch.conditions.filter((_:any, idx:number) => idx !== index)
                    return { ...branch, conditions: updatedConditions }
                }
                else if (type === 'add') return {...branch, conditions: [...branch.conditions, []]}
              })
            }
          }
        })
      )
    }

    //ADD OR DELETE BRANCHES
    const editBranch = (nodeId:string | undefined, index:number | undefined, type:'remove' | 'add') => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            let updatedBranches
            if (type === 'remove') updatedBranches = node.data.branches.filter((_:any, idx:number) => idx !== index)
            else if (type === 'add') updatedBranches = [...node.data.branches, { name: '', conditions: [], next_node_index: 0 }]
            return {
                ...node,
                data: {
                ...node.data,
                branches: updatedBranches
            }}
        
        })
      )
    }

    //ADD OR DELETE VARIABLE IN EXTRACTOR
    const editExtractor = (nodeId:string | undefined, index:number | undefined, type:'remove' | 'add') => {
        setNodes((nds) => nds.map((node) => {
            if (node.id !== nodeId) return node
            let updatedVariables
            if (type === 'remove') updatedVariables = node.data.variables.filter((_:any, idx:number) => idx !== index)
            else if (type === 'add') updatedVariables = [...node.data.variables, { index: 0, message:{type:'generative', generation_instructions:'', preespecified_messages:{}} }]
            return {
                ...node,
                data: {
                ...node.data,
                variables: updatedVariables
            }}
        
        })
      ) 
    }
    
    //FETCH INITIAL DATA
    useEffect(() => {
        const fetchInitialData = async () => {
            if (location.endsWith('create')) {
                setNodes([
                    {id:'0', position:{x:0, y:0}, data:{channels:[], setChannels}, type:'trigger', dragging:false, deletable:false, draggable:false},
                        {id:'1', position:{x:300, y:0}, data:{addNewNode}, type:'add', dragging:false, deletable:false, draggable:false}
                //{id:'1', position:{x:350, y:0}, data:{branches:[], setShowNodesAction, editBranch}, type:'brancher', dragging:false,deletable:false, draggable:false},
                //{id:'2', position:{x:700, y:0}, data:{branches:[], variables:[], setShowNodesAction, editBranch, editExtractor}, type:'extractor', dragging:false,deletable:false, draggable:false},
                //{id:'3', position:{x:700, y:200}, data:{branches:[], variables:[], setShowNodesAction, editBranch, editExtractor}, type:'extractor', dragging:false,deletable:false, draggable:false}
             ])
                setEdges([
                    { id: '0->1', type: 'custom', source: '0', target: '1' },
                ])
            }
            else {
                const flowId = location.split('/')[location.split('/').length - 1]
                const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/clients/${flowId}`, auth})
            }
        }
        fetchInitialData()
    }, [])


    const NodesEditBox = () => {

        const node = nodes.find(node => node.id === showNodesAction?.nodeId)
        const branchData = node?.data.branches[showNodesAction?.actionData.index]

        function updateConditionInBranch(conditionIndex: number, key: 'variable_index' | 'op' | 'value', newValue: any) {
            const updatedConditions = [...branchData.conditions]
            updatedConditions[conditionIndex] = {
              ...updatedConditions[conditionIndex],
              [key]: newValue
            }
        return updatedConditions
        }

         
        const variableTypeList:DataTypes[] = ['bool', 'int', 'float', 'str', 'timestamp', 'list', 'json']
        const variablesLabelsMap:{[key:number]:string} = {}
        variableTypeList.forEach((type, index) => {variablesLabelsMap[index] = t(variableTypeList[index])})

        
        const columnInequalities = {'bool':['eq', 'exists'], 'int':['leq', 'geq', 'eq', 'neq', 'in', 'nin', 'exists'], 'float':['leq', 'geq', 'eq', 'neq', 'in', 'nin', 'exists'], 'str':['eq', 'neq', 'in', 'nin', 'contains', 'ncontains', 'exists'], 'timestamp':['geq', 'leq', 'eq', 'neq', 'exists'], 'list':['contains', 'ncontains', 'exists'], 'json':['contains', 'ncontains', 'exists'] }
        const inequalitiesMap = {"eq":t('eq'), "neq": t('neq'), "leq": t('leq'), "geq": t('geq'), "in":t('in'), "nin":t('nin'), "contains": t('contains'), "ncontains": t('ncontains'), "exists":t('exists')}
    
        //SELECTOR COMPONENTE, DEPENDING ON THR COLUMN
        const GetInputComponent = ({ type, scrollRef, condition, index }:{type:DataTypes ,scrollRef:RefObject<HTMLDivElement>, condition: {variable_index:number, op:string, value:any}, index:number}) => {
            
            const boolDict = {true:t('true'), false:t('false')}
            const datesMap = {'{today}':t('today'), '{yesterday}':t('yesterday'), '{start_of_week}':t('start_of_week'),'{start_of_month}':t('start_of_month')}

             
            switch(type) {
                case 'bool':
                    return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))}  options={Object.keys(boolDict)} labelsMap={boolDict}/>
                case 'int':
                case 'float':
                    <NumberInput value={condition.value} onChange={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))} min={1} max={1000000} clampValueOnBlur={false} >
                        <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                    </NumberInput>                
                case 'str':
                        return <EditText value={condition.value} setValue={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))} hideInput={false} />
                case 'timestamp':
                    return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value}  setSelectedItem={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))}  options={Object.keys(datesMap)} labelsMap={datesMap}/>
                case 'list':
                    return <EditText value={condition.value}  setValue={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))}  hideInput={false} />
                case 'json':
                    return <EditText value={condition.value}  setValue={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))}  hideInput={false} />
                default:
                    return <EditText value={condition.value}  setValue={(value) => editBranchConditions(showNodesAction?.nodeId, showNodesAction?.actionData.index, updateConditionInBranch(index, 'value', value))}  hideInput={false} />
            }
        }

        
  

        switch (showNodesAction?.actionType) {
            case 'condition':
                {
                
                const scrollRef = useRef<HTMLDivElement>(null)

                return (
                    <Box ref={scrollRef}>
                        {branchData.conditions.map((condition:{variable_index:number, op:string, value:any}, index:number) => (
                            <Flex mt='.5vh'  key={`all-conditions-${index}`} alignItems='center' gap='20px'>
                                <Box flex='2'> 
                                    <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.variable_index} setSelectedItem={(value) => editBranchConditions(showNodesAction.nodeId, showNodesAction.actionData.index, updateConditionInBranch(index, 'variable_index', value))} options={Array.from({length: 7}, (v, i) => i)} labelsMap={variablesLabelsMap} />
                                </Box>
                                <Box flex='1'>
                                    <CustomSelect containerRef={scrollRef} labelsMap={inequalitiesMap} hide={false} selectedItem={condition.op} setSelectedItem={(value) => editBranchConditions(showNodesAction.nodeId, showNodesAction.actionData.index, updateConditionInBranch(index, 'op', value))} options={columnInequalities[variableTypeList[condition.variable_index]]}/>
                                </Box>
                                <Box flex='2'>
                                    {GetInputComponent({ type:variableTypeList[condition.variable_index], scrollRef, condition, index})}
                                </Box>
                                <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => editBranchConditions(showNodesAction.nodeId, showNodesAction.actionData.index, undefined, 'remove')}/>
                            </Flex>
                        ))}
                        <Button size='sm' mt='2vh' leftIcon={<FaPlus/>} onClick={() => editBranchConditions(showNodesAction.nodeId, showNodesAction.actionData.index, undefined, 'add')}>Añadir condición</Button>

                    </Box>                    
                )
            }
            default: return <></>
        }
    }

    const customHeight = `calc(${window.innerHeight - (nameInputRef?.current?.getBoundingClientRect().bottom || 0)}px - 4vw)`

    return (
        <Flex height={'100vh'} width={'calc(100vw - 60px)'} flexDir={'column'}>

            <Flex left={'2vw'} ref={nameInputRef} top='2vw' zIndex={100} bg='white' width={'400px'} borderRadius={'.5rem'} borderWidth={'1px'} borderColor={'gray.300'} position={'absolute'} > 
                <EditText nameInput={true} hideInput={true} size='md' maxLength={70}  value={flowName} setValue={setFlowName}/>
            </Flex>

            <Flex gap='15px'  position={'absolute'} right={'2vw'} top='2vw' zIndex={100}  >
                <Button size='sm' bg='transparent' borderColor={'gray.300'} borderWidth={'1px'}>Testear</Button>
                <Button size='sm' bg='red.400' _hover={{bg:'red.500'}}  color='white'>Cerrar</Button>
                <Button size='sm' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} color='white'>Guardar cambios</Button>
            </Flex>


            <Box width={'100%'} height={'100%'}bg='gray.100' ref={flowBoxRef} >   
                <ReactFlow  nodes={nodes} nodeTypes={nodeTypes}  edgeTypes={edgeTypes} onNodesChange={onNodesChange} edges={edges} onEdgesChange={onEdgesChange} fitView>
                    <Controls />
                    <Background  gap={12} size={1} />
                </ReactFlow>
            </Box>

            <AnimatePresence> 
                {showNodesAction && 
                    <MotionBox initial={{ height:0}} animate={{ height: customHeight }} exit={{ height: 0}} transition={{ duration: .2 }} right={'2vw'} userSelect={'none'} width={'800px'} bottom={`calc(${nameInputRef?.current?.getBoundingClientRect().bottom}px + 2vw)`} zIndex={100} bg='white' p='20px' position={'absolute'} borderRadius={'1rem'} overflow={'hidden'}>
                        <NodesEditBox/>
                    </MotionBox>
                }
            </AnimatePresence>
     
        </Flex>
    )
}

export default Flow









 

