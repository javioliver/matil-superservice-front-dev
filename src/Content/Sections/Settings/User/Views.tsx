
//REACT
import  { useState, useRef, Dispatch, SetStateAction, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import { useAuth } from '../../../../AuthContext'
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Flex, Text, Box, Icon, IconButton, Button } from "@chakra-ui/react"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
//ICONS
import { BsThreeDots } from "react-icons/bs"
import  { FiEdit, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { FaRegClone, FaLockOpen, FaLock, FaPlus } from 'react-icons/fa6'
import { TbTrash } from 'react-icons/tb'
//FUNCTIONS
import useOutsideClick from '../../../Functions/clickOutside'
//TYPING
import { View, Views } from '../../../Constants/typing'
import showToast from '../../../Components/ToastNotification'
 
type boxPosition = {right:number, top:number, isFirst:boolean,isLast:boolean, box:{type:'private' | 'shared', index:number}} | null
interface ViewItemProps {
    view:View
    index:number
    type: 'private' | 'shared'
    length:number
    settingsBoxPosition:boxPosition
    setSettingsBoxPosition: Dispatch<SetStateAction<boxPosition>>
}

const ViewItem = ({view, index, type, length, settingsBoxPosition, setSettingsBoxPosition }:ViewItemProps) => {

    const navigate = useNavigate()
    const buttonRef = useRef<HTMLButtonElement>(null) 
    const [isHovering, setIsHovering] = useState<boolean>(false)
 
    return(
        <Flex onClick={() => navigate(`edit/${type}/${index}`)} alignItems={'center'} width='100%' gap='10px' justifyContent={'space-between'} p='7px' position='relative'  onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} bg={isHovering?'brand.hover_gray':'transaprent'}  cursor='pointer' borderBottomWidth={'1px'} borderBottomColor={'gray.300'}>
            <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{view.name}</Text>
            {(isHovering || (settingsBoxPosition?.box.type === type && settingsBoxPosition?.box.index === index)) && 
                 <IconButton size='xs' bg='transparent' border='none' ref={buttonRef} aria-label='show-settings' icon={<BsThreeDots size='20px'/>}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSettingsBoxPosition({
                    right:window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0) , 
                    top:buttonRef.current?.getBoundingClientRect().bottom || 0,
                    isFirst:index === 0,
                    isLast:index === length - 1,
                    box: {type:type, index:index},
                })}}/>
             }
       </Flex>
    )
}

//MAIN FUNCTION
function ViewsList () {
    
    //CONSTANTS
    const navigate = useNavigate()
    const auth = useAuth()
    const isAdmin = auth.authData.users?.[auth.authData?.userId || '']?.is_admin

    useEffect (() => {document.title = `Ajustes - Usuarios - ${auth.authData.organizationName} - Matil`}, [])

    const [currentPrivateViews, setCurrentPrivateViews] = useState<View[]>('private_views' in (auth.authData.views as Views) ? (auth.authData.views as Views).private_views : [])
    const [currentSharedViews, setCurrentSharedViews] = useState<View[]>('shared_views' in (auth.authData.views as Views) ? (auth.authData.views as Views).shared_views : [])

    const [settingsBoxPosition, setSettingsBoxPosition] = useState<boxPosition>(null)
    const boxRef = useRef<HTMLDivElement>(null) 
    useOutsideClick({ref1:boxRef, onOutsideClick:(value:boolean) => {setSettingsBoxPosition(null)}})

    //UPDATE THE VIEWS LIST
    const updateOrder = async (toDelete:boolean, newPrivateViews:View[], newSharedViews:View[]) => {

        
        if (toDelete) {
            const { box } = settingsBoxPosition || {}
            const { type, index } = box || {}

            const indexToDelete = index as number

            if (indexToDelete !== -1) {
                if (type === 'shared') newSharedViews.splice(indexToDelete, 1)
                else newPrivateViews.splice(indexToDelete, 1)
            }
            else {
                showToast({type:'failed', message:'Hubo un error al eliminar la vista'})
                return 
            }
        }

        const newViews = {'private_views': newPrivateViews, 'shared_views': newSharedViews}
        const response = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/user`, method: 'put', requestForm: {...newViews, shortcuts:auth.authData.shortcuts, users:auth.authData.users, tickets_subjects:auth.authData.ticket_subjects}, auth: auth, toastMessages: {'works': `${toDelete?'Vista eliminada':'Orden de las vistas actualizado'} con éxito`, 'failed': `Hubo un error al ${toDelete?'elimnar la vista':'actualizar el orden de las vistas'}`}})
    
        if (response?.status === 200) {
            auth.setAuthData({views: {...auth.authData.views, 'private_views': newPrivateViews, 'shared_views': newSharedViews}})
            setCurrentPrivateViews(newPrivateViews)
            setCurrentSharedViews(newSharedViews)
        }

    }

    //EDIT THE POSITION DRAGGING LOGIC
    const onDragEnd = (result:any, type: 'shared' | 'private') => {
        if (!result.destination) return
        const items = Array.from(type === 'shared'?currentSharedViews:currentPrivateViews)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)
        if (type === 'shared')  {updateOrder(false, currentPrivateViews, items);setCurrentSharedViews(items)}
        else {updateOrder(false, items, currentSharedViews);setCurrentPrivateViews(items)}
    }
    const movePosition = (position: 'top' | 'bottom', type: 'shared' | 'private', index: number) => {
    if (type === 'shared') {
            setCurrentSharedViews(prevItems => {
            const items = [...prevItems]
            const [item] = items.splice(index, 1)
            if (position === 'top') items.unshift(item)
            else items.push(item)
            updateOrder(false, currentPrivateViews, items)
            return items
        })
    } else {
        setCurrentPrivateViews(prevItems => {
        const items = [...prevItems]
        const [item] = items.splice(index, 1)
        if (position === 'top') items.unshift(item)
        else items.push(item)
        updateOrder(false, items, currentSharedViews)
        return items
        })
    }
    }
      
    return(<>
    <Box height={'100%'} width={'100%'}> 
        <Flex justifyContent={'space-between'} alignItems={'end'}> 
            <Box> 
                <Text fontSize={'1.4em'} fontWeight={'medium'}>Vistas</Text>
                <Text color='gray.600' fontSize={'.9em'}>Organiza tus tickets de la manera más eficiente.</Text>
            </Box>
            <Flex gap='10px'> 
                 <Button leftIcon={<FaPlus/>} onClick={() => navigate('edit')}>Crear vista</Button>
            </Flex>
       </Flex>

        <Box width='100%' bg='gray.300' height='1px' mt='2vh' mb='5vh'/>
        <Flex gap='3vw'>
            <Box flex='1'>
    
                <Flex alignItems={'center'} gap='10px'> 
                    <Icon as={FaLock} boxSize='20px' color='gray.400'/>
                    <Text fontSize={'1.2rem'} fontWeight={'medium'}>Vistas Privadas</Text>
                </Flex>
            
                {currentPrivateViews.length !== 0? <> 
                    <Box width='100%' bg='gray.300' height='1px' mt='3vh'/>
                    <DragDropContext onDragEnd={(result) => onDragEnd(result, 'private')}>
                        <Droppable droppableId="private-views" direction="vertical">
                            {(provided) => (
                                <Box ref={provided.innerRef} {...provided.droppableProps} >
                                {currentPrivateViews.map((view, index) => (
                                <Draggable  key={`draggable-private-view-${index}`} draggableId={`draggable-private-view-${index}`} index={index}>
                                {(provided, snapshot) => (
                                    <Box boxShadow={snapshot.isDragging?'0 4px 8px rgba(0, 0, 0, 0.3)':'none'}  bg={snapshot.isDragging ? 'brand.hover_gray' : 'transaparent'} ref={provided.innerRef}  {...provided.draggableProps} {...provided.dragHandleProps} > 
                                        <ViewItem view={view} index={index} type='private' settingsBoxPosition={settingsBoxPosition} length={currentPrivateViews.length} setSettingsBoxPosition={setSettingsBoxPosition} />
                                    </Box>
                                    )}
                                </Draggable>
                                ))}
                                {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
                    </>:
                <Text mt='2vh'>No hay vistas privadas</Text>
            }
         
            </Box>

            {isAdmin && 
            <Box flex='1'>
                <Flex alignItems={'center'} gap='10px'> 
                    <Icon as={FaLockOpen} boxSize='20px' color='gray.400'/>
                    <Text fontSize={'1.2rem'} fontWeight={'medium'}>Vistas Compartidas</Text>
                </Flex> 
                {currentSharedViews.length !== 0? <> 
                    <Box width='100%' bg='gray.300' height='1px' mt='3vh'/>
                    <DragDropContext onDragEnd={(result) => onDragEnd(result, 'shared')}>
                        <Droppable droppableId="shared-views" direction="vertical">
                            {(provided) => (
                                <Box ref={provided.innerRef} {...provided.droppableProps} >
                                {currentSharedViews.map((view, index) => (
                                <Draggable   key={`shared-view-${index}`} draggableId={`draggable-shared-view-${index}`} index={index}>
                                {(provided, snapshot) => (
                                    <Box boxShadow={snapshot.isDragging?'0 4px 8px rgba(0, 0, 0, 0.3)':'none'}  bg={snapshot.isDragging ? 'brand.hover_gray' : 'transaparent'}  ref={provided.innerRef}  {...provided.draggableProps} {...provided.dragHandleProps} > 
                                        <ViewItem view={view} index={index} type='shared' settingsBoxPosition={settingsBoxPosition} length={currentSharedViews.length} setSettingsBoxPosition={setSettingsBoxPosition} />
                                    </Box>
                                    )}
                                </Draggable>
                                ))}
                                {provided.placeholder}
                                </Box>
                            )}
              
                        </Droppable>
                    </DragDropContext>
                    </>:
                <Text mt='2vh'>No hay vistas compartidas</Text>
            }
            </Box>}
             
        </Flex>
        {settingsBoxPosition &&  
            <Box onClick={() => setSettingsBoxPosition(null)} overflow={'hidden'} boxShadow='0 0 10px 1px rgba(0, 0, 0, 0.13)' right={settingsBoxPosition.right} top={settingsBoxPosition.top} fontSize={'.8em'} background='white' borderRadius='.3rem' borderWidth='1px' borderColor='gray.200' zIndex={5} position='fixed' ref={boxRef}   >
                <Flex px='15px'  onClick={() => navigate(`edit/${settingsBoxPosition.box.type}/${settingsBoxPosition.box.index}`)} py='10px' cursor={'pointer'} gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}}>
                    <Icon as={FiEdit}/>
                    <Text whiteSpace={'nowrap'}>Editar vista</Text>
                </Flex>
                <Flex  px='15px' py='10px'cursor={'pointer'} onClick={() => navigate(`edit/${settingsBoxPosition.box.type}/${settingsBoxPosition.box.index}/copy`)} gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}}>
                    <Icon as={FaRegClone}/>
                    <Text whiteSpace={'nowrap'}>Clonar vista</Text>
                </Flex>
                <Flex  px='15px' py='10px'cursor={'pointer'} onClick={() => updateOrder(true, currentPrivateViews, currentSharedViews)} gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}}>
                    <Icon as={TbTrash}/>
                    <Text whiteSpace={'nowrap'}>Eliminar vista</Text>
                </Flex>
                {!settingsBoxPosition.isFirst && 
                <Flex onClick={() => movePosition('top', settingsBoxPosition.box.type, settingsBoxPosition.box.index)} cursor={'pointer'}  px='15px' py='10px' gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}}>
                    <Icon as={FiArrowUp}/>
                    <Text whiteSpace={'nowrap'}>Mover a la primera posición</Text>
                </Flex>}
                {!settingsBoxPosition.isLast && 
                <Flex onClick={() => movePosition('bottom', settingsBoxPosition.box.type, settingsBoxPosition.box.index)}   cursor={'pointer'}  px='15px' py='10px' gap='10px' alignItems={'center'} _hover={{bg:'brand.hover_gray'}}>
                    <Icon as={FiArrowDown}/>
                    <Text whiteSpace={'nowrap'}>Mover a la última posición</Text>
                </Flex>}
            </Box >}
 
    </Box> 
 
    </>)
}

export default ViewsList