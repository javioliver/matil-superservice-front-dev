
//REACT
import  { useState, useRef, useEffect, RefObject } from 'react'
import { useAuth } from '../../../../AuthContext'
import DOMPurify from 'dompurify'
import { useLocation, useNavigate } from 'react-router-dom'
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Flex, Text, Box, Tooltip, Input, IconButton, Button, NumberInput, NumberInputField,NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
//COMPONENTS
import EditText from '../../../Components/EditText'
import LoadingIconButton from '../../../Components/LoadingIconButton'
import CustomSelect from '../../../Components/CustomSelect'
//ICONS
import { FaPlus, FaUnlock, FaLock  } from 'react-icons/fa6'
import { IoIosArrowBack} from 'react-icons/io'
import { RxCross2 } from 'react-icons/rx'
//FUNCTIONS
import useOutsideClick from '../../../Functions/clickOutside'
//TYPING
import { View, TicketColumn, Views } from '../../../Constants/typing'
  
//MAIN FUNCTION
function EditView ({scrollRef}:{scrollRef:RefObject<HTMLDivElement>}) {

    //CONSTANTS
    const auth = useAuth()
    const navigate = useNavigate()
    const location = useLocation().pathname
    const lastLocationString = location.split('/')[location.split('/').length - 1]
    const view:{type:'private' | 'shared', index:number} | null = lastLocationString === 'edit' ? null : lastLocationString === 'copy' ? {index:parseInt(location.split('/')[location.split('/').length - 2]), type:location.split('/')[location.split('/').length - 3] as 'private' | 'shared'}:{index:parseInt(lastLocationString), type:location.split('/')[location.split('/').length - 2] as 'private' | 'shared'}
    
    //CONSTANTS FOR MAPPING THE COLUMS
    const columnsMap: { [key in TicketColumn]: [string, string] } = {
        id: ["Id", "🔢"],
        local_id: ["Id", "🔢"],
        user_id: ["Agente asignado", "🎧"],
        channel_type: ["Canal", "💬"],
        created_at: ["Creado", "📅"],
        updated_at: ["Última interacción", "🔄"],
        solved_at: ["Fecha de resolución", "✅"],
        closed_at: ["Cerrado", "🚪"],
        title: ["Descripción", "📝"],
        subject: ["Tema", "📚"],
        urgency_rating: ["Prioridad", "⚠️"],
        status: ["Estado", "📊"],
        deletion_date: ["Fecha de eliminación", "❌"],
        unseen_changes: ["Mensajes no leídos", "👀"]
      }
      
    let usersMap:{[key:string]:string} = {}
    for (let key in auth.authData.users) {if (auth.authData.users.hasOwnProperty(key)) usersMap[key] = auth.authData.users[key].name + ' ' +  auth.authData.users[key].surname}
    usersMap['0'] = 'Sin agente'
    usersMap['-1'] = 'Matilda'
    usersMap['{user_id}'] = usersMap[auth.authData?.userId || '-1']
    delete usersMap[auth.authData?.userId || '-1']
    const datesMap = {'{today}':'Hoy', '{yesterday}':'Ayer', '{start_of_week}':'Principio de esta semana','{start_of_month}':'Principio de este mes'}
    const columns: TicketColumn[] = Object.keys(columnsMap) as TicketColumn[]

    //IS ADMIN
    const isAdmin = auth.authData.users?.[auth.authData?.userId || '']?.is_admin

    //BOOLEAN FOR WAIT THE UPLOAD
    const [waitingSend, setWaitingSend] = useState<boolean>(false)

    //DETERMINE THE EDIT VIEW TYPE
    const viewsAuth = auth.authData.views as Views
    const viewLocation = view ? view.type === 'private' ? 'private_views':'shared_views':'private_views'
    const [viewType, setViewType] = useState<'private' | 'shared'>(view ?view.type:'private')
    let selectedViewSelection:View = {
        'name': 'Nueva vista',
        'columns': [],
        'created_at':'',
        'all_conditions': [],
        'any_conditions': [],
        'order_by': {
          'column': 'local_id',
          'order': 'asc'
        }
      }
    if (lastLocationString !== 'copy' && view !== null) selectedViewSelection = viewsAuth[viewLocation][view.index]
    else if (view !== null) {const originalView = viewsAuth[viewLocation][view.index];const v = { ...originalView, name: originalView.name + ' Copia' };selectedViewSelection = v}

      //SELECTED VIEW
    const [selectedView, setSelectedView] = useState<View>(selectedViewSelection)  

     //ADD CONDITIONS LOGIC
    function handleConditionChange(index: number, key: 'column' | 'operation_type' | 'value', value: any, type: 'all_conditions' | 'any_conditions'): void {
        if (key === 'column') {const columnValue = value as TicketColumn}
        const newConditions = [...selectedView[type]];
        newConditions[index][key] = value
        setSelectedView({ ...selectedView, [type]: newConditions })
    }

    const addCondition = (type: 'all_conditions' | 'any_conditions') => {
        const freeColumns = columns.filter(column => !selectedView[type].map(item => item.column).includes(column))
        const newConditions = [...selectedView[type], { column: freeColumns[0], operation_type: 'geq', value: '' }]
        setSelectedView({ ...selectedView, [type]: newConditions })
    }
    const removeCondition = (index:number, type:'all_conditions' | 'any_conditions') => {
        const newConditions = [...selectedView[type]]
        newConditions.splice(index, 1)
        setSelectedView({ ...selectedView, [type]: newConditions })
    }
      
    //EDIT VISIBLE COLUMNS LOGIC
    const columnBox = useRef<HTMLDivElement>(null)
    const columnButtonRef = useRef<HTMLButtonElement>(null)
    const [addColumnBox, setAddColumBox] = useState<{bottom:number, left:number} | null>(null)
    const [columnsToSelect, setColumnsToSelect] = useState<TicketColumn[]>(columns.filter(column => !selectedView.columns.includes(column)))
    useEffect(() => {setColumnsToSelect(columns.filter(column => !selectedView.columns.includes(column)))}, [selectedView])
    useOutsideClick({ref1:columnBox, ref2:columnButtonRef, onOutsideClick:(b:boolean) => {setAddColumBox(null)}})
    const handleShowColumnBox = () => {
        if (addColumnBox) setAddColumBox(null)
        else if (columnButtonRef?.current) setAddColumBox({bottom:window.innerHeight - columnButtonRef.current.getBoundingClientRect().top, left:columnButtonRef.current.getBoundingClientRect().left})
    }
    const addColumn = (column:TicketColumn) => {
        setSelectedView({ ...selectedView, columns: [...selectedView.columns, column] })
        setAddColumBox(null)
    }
    const removeColumn = (index: number) => {
        const newColumns = [...selectedView.columns];
        newColumns.splice(index, 1);
        setSelectedView({ ...selectedView, columns: newColumns })
    }
    const onDragEnd = (result:any) => {
        if (!result.destination) return
        const items = Array.from(selectedView.columns)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)
        setSelectedView({ ...selectedView, columns: items })
      }
      

    //CHANGE ORDER LOGIC
    const handleOrderChange = (value:TicketColumn | 'asc' | 'desc' ,  type:'column' | 'order') => {
    const newOrder = {...selectedView.order_by}
        if (type === 'order') {
            newOrder.order = value
            setSelectedView({ ...selectedView, order_by: newOrder })
        }
        else if (value !== 'asc' && value !== 'desc') {
            newOrder.column = value
            setSelectedView({ ...selectedView, order_by: newOrder })
        }
    }

    //SEND ALL THE CHANGES 
    const sendEditView = async() => {

        const viewsAuthChange = {...auth.authData.views as Views}
        const mapType: { [key in 'shared' | 'private']: 'shared_views' | 'private_views' } = {
            'shared': 'shared_views',
            'private': 'private_views'
        }

        if (view && lastLocationString !== 'copy') {
            if (view.type === viewType){
                if (viewsAuthChange[mapType[viewType]] && viewsAuthChange[mapType[viewType]][view.index]) viewsAuthChange[mapType[viewType]][view.index] = selectedView
            }
            else {
                console.log(viewsAuthChange[mapType[view.type]])
                console.log(viewsAuthChange[mapType[view.type]].splice(view.index, 1))
                if (viewsAuthChange[mapType[viewType]] && viewsAuthChange[mapType[viewType]][view.index]) viewsAuthChange[mapType[view.type]].splice(view.index, 1)
                if (viewsAuthChange[mapType[viewType]]) viewsAuthChange[mapType[viewType]].push(selectedView)
            }
        }
        else {
            viewsAuthChange[mapType[viewType]].push(selectedView)
        }
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/user`, method:'put',setWaiting:setWaitingSend,auth:auth, requestForm:{...viewsAuthChange, shortcuts:auth.authData.shortcuts, users:auth.authData.users, tickets_subjects:auth.authData.ticket_subjects},toastMessages:{'works':'Vista actualizada con éxito', 'failed':'Hubo un error al actualizar la vista'}})
        if (response?.status === 200) {
            auth.setAuthData({views:viewsAuthChange})   
            navigate('/settings/people/edit-views')
        }
    }
   
    //CHANGE DOCUMENT TITLE
    useEffect (() => {document.title = `Ajustes - Usuarios - ${selectedView.name} - ${auth.authData.organizationName} - Matil`}, [])

    //INEQUALITY TYPE DEPENDING ON THE COLUMN
    const columnInequalities = {'id':['leq', 'geq'], 'local_id':['leq', 'geq'], 'user_id':['eq', 'neq'], 'channel_type':['eq', 'neq'], 'created_at':['geq', 'leq', 'eq'], 'deletion_date':['geq', 'leq', 'eq'], 'updated_at':['geq', 'leq', 'eq'], 'solved_at':['geq', 'leq', 'eq'], 'urgency_rating': ['geq', 'leq', 'eq'], 'status': ['neq', 'eq'], 'subject':['eq', 'neq'], 'closed_at':['geq', 'leq', 'eq'], 'language':['eq', 'neq'], 'title':['geq', 'leq'], 'unseen_changes':['geq', 'leq'],}
    const inequialitiesMap = {'geq':'Mayor que', 'leq':'Menor que', 'eq':'Igual que', 'neq':'Distinto de'}
    
    //SELECTOR COMPONENTE, DEPENDING ON THR COLUMN
    const GetInputComponent = ({ condition, index, type, scrollRef }:{condition:{column:TicketColumn, value:any, operation_type:'geq'|'leq'|'eq'}, index:number,type: 'all_conditions' | 'any_conditions', scrollRef:RefObject<HTMLDivElement> }) => {
        
        const channelsMap = {'whatsapp':'Whatsapp', 'mail':'Correo electrónico', 'webchat':'Chat Web','instagram':'Instagram','google-business':'Google Business'}
        const urgencyMap:{[key:number]:string} = {0:'Baja (0)', 1:'Media (1)', 2:'Alta (2)', 3:'Muy Alta (3)', 4:'Urgente (4)'}
        const statesMap = {'new':'Nuevo', 'open':'Abierto','pending':'Pendiente','solved':'Resuelto', 'closed':'Cerrado'}
 
        switch(condition.column) {
            case 'id':
            case 'local_id':
                return <NumberInput value={condition.value} onChange={(value) => handleConditionChange(index, 'value', parseInt(value), type)} min={1} max={1000000} clampValueOnBlur={false} >
                            <NumberInputField borderRadius='.5rem'  fontSize={'.9em'} height={'37px'}  borderColor={'gray.300'} _hover={{ border:'1px solid #CBD5E0'}} _focus={{ px:'11px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} px='12px' />
                        </NumberInput>
            case 'user_id':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={Object.keys(usersMap)} labelsMap={usersMap}/>
            case 'channel_type':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={Object.keys(channelsMap)} labelsMap={channelsMap}/>
            case 'created_at':
            case 'deletion_date':
            case 'updated_at':
            case 'solved_at':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={Object.keys(datesMap)} labelsMap={datesMap}/>
            case 'subject':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={auth?.authData?.ticket_subjects || []}/>
            case 'urgency_rating':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={Object.keys(urgencyMap)} labelsMap={urgencyMap}/>
            case 'status':
                return <CustomSelect containerRef={scrollRef} hide={false} selectedItem={condition.value} setSelectedItem={(value) => handleConditionChange(index, 'value', value, type)} options={['new', 'open', 'pending', 'solved', 'closed']} labelsMap={statesMap}/>
            default:
                return <EditText value={condition.value} setValue={(value) => handleConditionChange(index, 'value', value, type)} hideInput={false} />
        }
    }
          
    return(<>
    <Flex height={'100%'} width={'100%'} flexDir={'column'}> 
        <Box flex='1' overflow={'scroll'} py='2px'> 
            <Flex gap='20px' alignItems={'center'}> 
                <Tooltip label={'Atrás'}  placement='bottom' hasArrow bg='black'  color='white'  borderRadius='.4rem' fontSize='.75em' p='4px'> 
                    <IconButton aria-label='go-back' size='sm' bg='transparent' border='none' onClick={() => navigate('/settings/people/edit-views')} icon={<IoIosArrowBack size='20px'/>}/>
                </Tooltip>
                <Input maxW='700px' maxLength={100}  borderColor={'transparent'} _hover={{ border:'1px solid #CBD5E0'}} px='13px' _focus={{ px:'12px', borderColor: "rgb(77, 144, 254)", borderWidth: "2px" }} fontSize={'1.4em'} fontWeight={'medium'}  borderRadius='.5rem' value={selectedView.name} onChange={(e) => {setSelectedView({...selectedView,name:DOMPurify.sanitize(e.target.value)})}}/>
            </Flex>
        
                <Text mt='3vh' fontWeight={'medium'} fontSize={'1.1em'}>Tipo de vista</Text>
                <Flex gap='20px' mt='1vh'>
                    <Button leftIcon={<FaLock/>} size='sm' bg={viewType === 'private'?'gray.300':'none'} color={'black'} _hover={{bg:viewType === 'private'?'gray.300':'gray.100'}}  onClick={() => setViewType('private')}>Privada</Button>
                    <Button leftIcon={<FaUnlock/>} isDisabled={!isAdmin} size='sm' bg={viewType !== 'private'?'gray.300':'none'} color={'black'} _hover={{bg:viewType !== 'private'?'gray.300':'gray.100'}}  onClick={() => setViewType('shared')}>Compartida</Button>
                </Flex>
                <Text mt='3vh' fontWeight={'medium'} fontSize={'1.1em'}>Condiciones</Text>
                <Text color='gray.600' fontSize={'.9em'}>Organiza tus tickets de la manera más eficiente</Text>

                <Text mt='1vh' mb='2vh' fontWeight={'medium'}>Los tickets deben satisfacer todas estas condiciones para aparecer en la vista</Text>
                {selectedView.all_conditions && selectedView.all_conditions.map((condition, index) => (
                    <Flex mt='.5vh'  key={`all-conditions-${index}`} alignItems='center' gap='20px'>
                        <Box flex='2'> 
                            <CustomSelect containerRef={scrollRef} hide={false} selectedItem={columnsMap[condition.column][0] as TicketColumn} setSelectedItem={(value:TicketColumn) => handleConditionChange(index, 'column', value, 'all_conditions')} options={columns.filter(column => column !== 'id')}iconsMap={columnsMap}/>
                        </Box>
                        <Box flex='1'>
                            <CustomSelect containerRef={scrollRef} labelsMap={inequialitiesMap} hide={false} selectedItem={condition.operation_type} setSelectedItem={(value:string) => handleConditionChange(index, 'operation_type', value, 'all_conditions')} options={columnInequalities[condition.column]}/>
                        </Box>
                        <Box flex='2'>
                            {GetInputComponent({condition, index, type:'all_conditions', scrollRef})}
                        </Box>
                        <IconButton bg='transaprent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => removeCondition(index, 'all_conditions')}/>
                    </Flex>
                ))}
                <Button size='sm' mt='2vh' leftIcon={<FaPlus/>}  isDisabled={selectedView.all_conditions.length === columns.length}   onClick={() => addCondition('all_conditions')}>Añadir condición</Button>

                <Text mt='3vh' mb='2vh'  fontWeight={'medium'}>Los tickets pueden satisfacer cualquiera de estas condiciones para aparecer en la vista</Text>
                {selectedView.any_conditions &&selectedView.any_conditions.map((condition, index) => (
                    <Flex mt='.5vh' key={`any-conditions-${index}`}  alignItems='center' gap='20px'>
                        <Box flex='2'> 
                            <CustomSelect  containerRef={scrollRef} hide={false} selectedItem={columnsMap[condition.column][0] as TicketColumn} setSelectedItem={(value:TicketColumn) => handleConditionChange(index, 'column', value, 'any_conditions')} options={columns} iconsMap={columnsMap}/>
                        </Box>
                        <Box flex='1'>
                            <CustomSelect containerRef={scrollRef} labelsMap={inequialitiesMap} hide={false} selectedItem={condition.operation_type} setSelectedItem={(value:string) => handleConditionChange(index, 'operation_type', value, 'any_conditions')} options={columnInequalities[condition.column]}/>
                        </Box>
                        <Box flex='2'>
                            {GetInputComponent({condition, index, type:'any_conditions', scrollRef})}
                        </Box>
                        <IconButton bg='transparent' border='none' size='sm' _hover={{bg:'gray.200'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => removeCondition(index, 'any_conditions')}/>
                    </Flex>
                ))}
                <Button mt='2vh'  leftIcon={<FaPlus/>} size='sm' isDisabled={(selectedView.any_conditions && selectedView.any_conditions.length === columns.length)} onClick={() => addCondition('any_conditions')}>Añadir condición</Button>

                <Text mt='3vh' mb='2vh' fontWeight={'medium'}>Columnas visibles</Text>
               
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="columns" direction="vertical">
                        {(provided) => (
                            <Box ref={provided.innerRef} {...provided.droppableProps} >
                                {selectedView.columns.map((column, index) => (
                                    <Draggable  key={`column-view-${index}`} draggableId={`column-view-${index}`} index={index}>
                                        {(provided, snapshot) => (
                                            <Flex ref={provided.innerRef} alignItems="center" gap='20px' width='40%'  {...provided.draggableProps} {...provided.dragHandleProps}   boxShadow={snapshot.isDragging?'0 4px 8px rgba(0, 0, 0, 0.3)':'none'}  flex='1' minW='300px' justifyContent={'space-between'}  mt='.5vh' bg='gray.100' borderRadius={'.5rem'} borderColor='gray.300' borderWidth={'1px'} p='5px'>
                                                <Flex gap='10px'> 
                                                    <Text fontWeight={'medium'} fontSize={'.9em'}>{columnsMap[column][0]}</Text>
                                                </Flex>
                                                <IconButton bg='transaprent' border='none' color='red.600' size='xs' _hover={{bg:'gray.200', color:'red.700'}} icon={<RxCross2/>} aria-label='delete-all-condition' onClick={() => removeColumn(index)}/>
                                         </Flex>)}
                                    </Draggable>
                                ))}  
                            {provided.placeholder}
                            </Box>
                        )}
                        
                    </Droppable>
                </DragDropContext>
                <Button ref={columnButtonRef} size='sm' mt='2vh' leftIcon={<FaPlus/>} isDisabled={columns.length === selectedView.columns.length} onClick={handleShowColumnBox}>Añadir columna</Button>

                <Text mt='3vh' mb='2vh' fontWeight={'medium'}>Ordenar por</Text>
                <Flex gap='40px' width={'60%'} minW={'600px'}> 
                    <Box flex='1'> 
                        <CustomSelect containerRef={scrollRef} hide={false} selectedItem={columnsMap[selectedView.order_by.column][0] as TicketColumn} setSelectedItem={(value:TicketColumn) => handleOrderChange(value, 'column')} options={columns.filter(column => column !== 'local_id')} iconsMap={columnsMap}/>
                    </Box>
                    <Flex gap='5px'>
                        <Button size='sm' bg={selectedView.order_by.order === 'asc'?'brand.gradient_blue':'none'} color={selectedView.order_by.order === 'asc'?'white':'none'} _hover={{bg:selectedView.order_by.order === 'asc'?'brand.gradient_blue_hover':'gray.300', color:selectedView.order_by.order === 'asc'?'white':'blue.500'}}  onClick={() => handleOrderChange('asc', 'order')}>Ascendente</Button>
                        <Button size='sm'   bg={selectedView.order_by.order  !== 'asc'?'brand.gradient_blue':'none'} color={selectedView.order_by.order !== 'asc'?'white':'none'} _hover={{bg:selectedView.order_by.order !== 'asc'?'brand.gradient_blue_hover':'gray.300', color:selectedView.order_by.order !== 'asc'?'white':'blue.500'}}  onClick={() => handleOrderChange('desc', 'order')}>Descendente</Button>
                    </Flex>
                </Flex>
        </Box>

        <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300'/>
        <Flex flexDir = 'row-reverse'>
            <Button onClick={sendEditView} isDisabled={selectedView.name === '' || ((view !== null && JSON.stringify(selectedView) === JSON.stringify(viewsAuth[viewLocation][view.index]) && viewType === view.type) )}>{waitingSend?<LoadingIconButton/>:'Guardar cambios'}</Button>
        </Flex>
    

        {addColumnBox &&
        <Box minW={columnButtonRef.current?.getBoundingClientRect().width} ref={columnBox} overflow={'scroll'} maxH={window.innerHeight - addColumnBox.bottom - 30} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.13)' left={addColumnBox.left} bottom={addColumnBox.bottom + 5} fontSize={'.8em'} background='white' borderRadius='.3rem' borderWidth='1px' borderColor='gray.200' zIndex={5} position='fixed'  >
                 {columnsToSelect.filter(column => column !== 'id').map((column, index) => (
                    <Flex key={`select-column-${index}`} px='15px' py='10px' cursor={'pointer'} gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}} onClick={() => addColumn(column)}>
                        <Text>{columnsMap[column][1]}</Text>
                        <Text >{columnsMap[column][0]}</Text>
                    </Flex>
                ))}
         </Box>}
    </Flex> 
    </>)
}

export default EditView


 