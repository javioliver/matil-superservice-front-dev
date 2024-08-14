//REACT
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../../../AuthContext"
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Text, Box, Flex, Button, NumberInput, NumberInputField, Skeleton } from "@chakra-ui/react"
//COMPONENTS
import LoadingIconButton from "../../../Components/LoadingIconButton"
 
interface TicketsConfigProps {
    solved_to_closed_days: 0
    no_activity_to_closed_days: number
    auto_move_to_bin_closed: boolean
    closed_to_bin_days: number
    auto_delete_bin: boolean
    bin_to_deleted_days:number
}

const User = () => {

    //CONSTANTS
    const auth = useAuth()
 
    //BOOLEAN FOR WAITING THE UPLOAD
    const [waitingSend, setWaitingSend] = useState<boolean>(false)

    //TICKETS DATA
    const ticketDataRef = useRef<TicketsConfigProps | null>(null)
    const [ticketsData, setTicketsData] = useState<TicketsConfigProps | null>(null)

    //FETCH NEW DATA WHEN THE VIEEW CHANGE
    useEffect(() => {        
        document.title = `Cuenta - Tickets - ${auth.authData.organizationId} - Matil`
        
        const fetchInitialData = async() => {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/data`, setValue:setTicketsData, auth})
            if (response?.status === 200) ticketDataRef.current = response.data
        }
        fetchInitialData()
     }, [])

    //FUNCTION FOR EDITING EACH KEY
    const handleEditKey = (key:keyof(TicketsConfigProps), value:boolean | number) => {if (ticketsData) setTicketsData(prev => ({...prev as TicketsConfigProps, [key]:value}))}

    //FUNCTION FOR SEND A NEW CONFIGURATION
    const sendNewTicketData = async() => {
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/data`, method:'put', requestForm:ticketsData as TicketsConfigProps, setValue:setTicketsData, setWaiting:setWaitingSend, auth, toastMessages:{works:'Configuración de los tockets guardada con éxito', failed:'Hubo un error al guardar la configuración de los tickets'}})
        if (response?.status === 200) ticketDataRef.current = ticketsData
    }
 
return(<>

    <Text fontSize={'1.4em'} fontWeight={'medium'}>Tickets</Text>
    <Text color='gray.600' fontSize={'.9em'}>Automatiza y optimiza la gestión de tus tickets.</Text>

    <Box width='100%' bg='gray.300' height='1px' mt='2vh' mb='5vh'/>

    <Box width={'60%'} minW={'500px'}> 

        <Text mt='2vh' fontWeight={'medium'}>Días para cerrar tickets solucionados</Text>
        <Text mb='1vh' fontSize={'.8em'} color='gray.500'>Número de días que un ticket permanece en estado "resuelto" antes de cerrarse automáticamente. Si se establece en 0, los tickets resueltos se cerrarán inmediatamente.</Text>
        <Skeleton isLoaded={!ticketsData !== null}> 
            <NumberInput size='sm' value={ticketsData?.solved_to_closed_days} onChange={(valueString) => handleEditKey('solved_to_closed_days', parseInt(valueString))} min={1} max={360}>
                <NumberInputField  fontSize={'.9em'} borderRadius='.5rem'   borderColor={'gray.300'} _hover={{ border: '1px solid #CBD5E0' }} _focus={{ borderColor: 'rgb(77, 144, 254)', borderWidth: '2px', px:'6px' }} px='7px' />
            </NumberInput>
        </Skeleton>

        <Text mt='2vh' fontWeight={'medium'}>Días de inactividad para cerrar tickets</Text>
        <Text mb='1vh' fontSize={'.8em'} color='gray.500'>Número de días sin actividad en un ticket antes de que se cierre automáticamente. Es útil para gestionar tickets que quedan abiertos sin respuesta.</Text>
        <Skeleton isLoaded={!ticketsData !== null}> 
            <NumberInput size='sm' value={ticketsData?.no_activity_to_closed_days} onChange={(valueString) => handleEditKey('no_activity_to_closed_days', parseInt(valueString))} min={1} max={360}>
                <NumberInputField  fontSize={'.9em'} borderRadius='.5rem'   borderColor={'gray.300'} _hover={{ border: '1px solid #CBD5E0' }} _focus={{ borderColor: 'rgb(77, 144, 254)', borderWidth: '2px', px:'6px' }} px='7px' />
            </NumberInput>
        </Skeleton>


        <Text mt='4vh' fontWeight={'medium'}>Mover a la papelera tickets cerrados</Text>
        <Text mb='1vh'  fontSize={'.8em'} color='gray.500'>Configuración que determina si los tickets cerrados se mueven a la papelera automáticamente.</Text>
        <Skeleton isLoaded={!ticketsData !== null}> 
            <Flex mt='1vh' gap='10px'>
                <Button  size='sm' onClick={(e) => handleEditKey('auto_move_to_bin_closed', false)} bg={!ticketsData?.auto_move_to_bin_closed?'brand.gradient_blue':'gray.100'} color={!ticketsData?.auto_move_to_bin_closed?'white':'black'} _hover={{bg:!ticketsData?.auto_move_to_bin_closed?'brand.gradient_blue_hover':'gray.200'}}>Guardar indefinidamente</Button>
                <Button size='sm' onClick={(e) => handleEditKey('auto_move_to_bin_closed', true)} bg={ticketsData?.auto_move_to_bin_closed?'brand.gradient_blue':'gray.100'} color={ticketsData?.auto_move_to_bin_closed?'white':'black'} _hover={{bg:ticketsData?.auto_move_to_bin_closed?'brand.gradient_blue_hover':'gray.200'}}>Eliminar automáticamente</Button>
            </Flex>
        </Skeleton>


        {ticketsData?.auto_move_to_bin_closed && <>   
            <Text mt='4vh' fontWeight={'medium'}>Días para eliminar tickets cerrados</Text>
            <Text mb='1vh' fontSize={'.8em'} color='gray.500'>Número de días que un ticket cerrado permanece en las vistas antes de ser enviado a la papelera automáticamente.</Text>
            <Skeleton isLoaded={!ticketsData !== null}> 
                <NumberInput size='sm' value={ticketsData?.closed_to_bin_days} onChange={(valueString) => handleEditKey('closed_to_bin_days', parseInt(valueString))} min={1} max={360}>
                    <NumberInputField  fontSize={'.9em'} borderRadius='.5rem'   borderColor={'gray.300'} _hover={{ border: '1px solid #CBD5E0' }} _focus={{ borderColor: 'rgb(77, 144, 254)', borderWidth: '2px', px:'6px' }} px='7px' />
                </NumberInput>
            </Skeleton>
        </>}

        <Text mt='4vh' fontWeight={'medium'}>Eliminar tickets en la papelera</Text>
        <Text mb='1vh'  fontSize={'.8em'} color='gray.500'>Configuración que determina si los tickets que están en la papelera se eliminan automáticamente.</Text>
        <Skeleton isLoaded={!ticketsData !== null}> 
            <Flex mt='1vh' gap='10px'>
                <Button  size='sm' onClick={(e) => handleEditKey('auto_delete_bin', false)} bg={!ticketsData?.auto_delete_bin?'brand.gradient_blue':'gray.100'} color={!ticketsData?.auto_delete_bin?'white':'black'} _hover={{bg:!ticketsData?.auto_delete_bin?'brand.gradient_blue_hover':'gray.200'}}> Guardar indefinidamente</Button>
                <Button size='sm' onClick={(e) => handleEditKey('auto_delete_bin', true)} bg={ticketsData?.auto_delete_bin?'brand.gradient_blue':'gray.100'} color={ticketsData?.auto_delete_bin?'white':'black'} _hover={{bg:ticketsData?.auto_delete_bin?'brand.gradient_blue_hover':'gray.200'}}>Eliminar automáticamente</Button>
            </Flex>
        </Skeleton>

        {ticketsData?.auto_delete_bin && <>   
            <Text mt='4vh' fontWeight={'medium'}>Días para eliminar tickets de la papelera</Text>
            <Text mb='1vh' fontSize={'.8em'} color='gray.500'>Número de días que un ticket permanece en la papelera antes de ser eliminado definitivamente.</Text>
            <Skeleton isLoaded={!ticketsData !== null}> 
                <NumberInput size='sm' value={ticketsData?.bin_to_deleted_days} onChange={(valueString) => handleEditKey('bin_to_deleted_days', parseInt(valueString))} min={1} max={360}>
                    <NumberInputField  fontSize={'.9em'} borderRadius='.5rem'   borderColor={'gray.300'} _hover={{ border: '1px solid #CBD5E0' }} _focus={{ borderColor: 'rgb(77, 144, 254)', borderWidth: '2px', px:'6px' }} px='7px' />
                </NumberInput>
            </Skeleton>
        </>}
        <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300'/>
        <Flex flexDir={'row-reverse'}> 
            <Button onClick={sendNewTicketData} isDisabled={JSON.stringify(ticketsData) === JSON.stringify(ticketDataRef.current)}>{waitingSend?<LoadingIconButton/>:'Guardar cambios'}</Button>
        </Flex>
    </Box></>)
}

export default User