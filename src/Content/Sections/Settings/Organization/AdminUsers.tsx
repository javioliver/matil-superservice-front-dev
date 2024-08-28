
//REACT
import  { useState, useEffect, Dispatch, SetStateAction, Fragment, useMemo } from 'react'
import { useAuth } from '../../../../AuthContext'
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Flex, Text, Box, IconButton, Tooltip, Button, Checkbox, Skeleton } from "@chakra-ui/react"
//COMPONENTS
import EditText from '../../../Components/EditText'
import LoadingIconButton from '../../../Components/LoadingIconButton'
import ConfirmBox from '../../../Components/ConfirmBox'
//ICONS
import { BsClipboard2Check, BsTrash3Fill } from "react-icons/bs"
import { FaPlus } from 'react-icons/fa6'
//FUNCTIONS
import copyToClipboard from '../../../Functions/copyTextToClipboard'


//TYPING
interface UserData  {
    "name": string,
    "surname": string,
    "email": string,
    "is_admin": boolean,
    "is_active": boolean,
    "invitation_key": string
}
interface NewUserBoxProps {
    userData:UserData[]
    setUserData:Dispatch<SetStateAction<UserData[]>>
    setShowCreateNewUser:Dispatch<SetStateAction<boolean>>
}
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


const NewUserBox = ({userData, setUserData, setShowCreateNewUser}:NewUserBoxProps) => {

    const auth = useAuth()
    const [showError, setShowError] = useState<string>('')

    //CREATE NEW USER LOGIC
    const [waitingCreate, setWaitingCreate] = useState<boolean>(false)
    const [newUserInfo, setNewUserInfo] = useState<{email:string, is_admin:boolean}>({email:'', is_admin:true})
     
    //CREATE A NEW USER FUNCTION
    const createNewUser = async() => {
       const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/users`, setWaiting:setWaitingCreate, requestForm:newUserInfo,auth:auth, method:'post'})
       if (response?.status === 200 && response?.data) {
           const newInvitationKey = response.data.invitation_key
           const newUser = {...newUserInfo, is_active:true, invitation_key:newInvitationKey, name:response.data.name, surname:response.data.surname}
           setUserData([...userData, newUser])
           auth.setAuthData({users:{...auth.authData.users, [response.data.id]:{name:response.data.name, surname:response.data.surname, email_address:newUserInfo.email, last_login:'', is_admin:newUserInfo.is_admin}}})
           setShowCreateNewUser(false)
           setNewUserInfo({email:'', is_admin:true})
           setShowError('')
        }
       else{
        setShowError('El usuario que ha introducido no existe. Por favor, compruebe que el email es correcto.')
       }
      
   }

    return(
        <> 
        <Box p='25px'> 
            <Text mt='1vh' mb='.5vh' fontWeight={'medium'}>Correo electrónico </Text>
            <EditText  regex={emailRegex} maxLength={100} placeholder='usuario@empresa.com' hideInput={false} value={newUserInfo.email} setValue={(value) => setNewUserInfo({...newUserInfo, email:value})}/>
            <Text mt='1vh' mb='.5vh' fontWeight={'medium'}>Rol</Text>
            <Flex gap='20px'>
                <Button size='xs' bg={newUserInfo.is_admin?'brand.gradient_blue':'gray.200'} color={newUserInfo.is_admin?'white':'none'} _hover={{bg:newUserInfo.is_admin?'brand.gradient_blue_hover':'gray.300', color:newUserInfo.is_admin?'white':'blue.600'}}  onClick={() => setNewUserInfo({...newUserInfo, is_admin: true})}>Administrador</Button>
                <Button size='xs' bg={!newUserInfo.is_admin?'brand.gradient_blue':'gray.200'} color={!newUserInfo.is_admin?'white':'none'} _hover={{bg:!newUserInfo.is_admin?'brand.gradient_blue_hover':'gray.300', color:!newUserInfo.is_admin?'white':'blue.600'}}  onClick={() => setNewUserInfo({...newUserInfo, is_admin:false})}>Básico</Button>
            </Flex>
            {showError !== '' && <Text mt='2vh' fontSize={'.85em'} color='red'>{showError}</Text>}
         </Box>
        <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
          <Button  size='sm' color='white' bg='brand.gradient_blue' _hover={{bg:'brand.gradient_blue_hover'}} onClick={createNewUser}>{waitingCreate?<LoadingIconButton/>:'Crear nuevo usuario'}</Button>
          <Button  size='sm' onClick={()=>setShowCreateNewUser(false)}>Cancelar</Button>
      </Flex>
      </>
    )
}
//MAIN FUNCTION
function AdminUsers () {

    const auth = useAuth()
    const [waitingInfo, setWaitingInfo] = useState<boolean>(true)

    //DATA AND FILTER WITH TEXT
    const [text, setText]  =useState<string>('')
    const [userData, setUserData] = useState<UserData[]>([])
    const [filteredUserData, setFilteredUserData] = useState<UserData[]>([])
      useEffect(() => {
        const filterUserData = () => {
          const filtered = userData.filter(user =>
            user.name.toLowerCase().includes(text.toLowerCase()) ||
            user.surname.toLowerCase().includes(text.toLowerCase()) ||
            user.email.toLowerCase().includes(text.toLowerCase())
          )
          setFilteredUserData(filtered)
        }
    
        filterUserData()
      }, [text, userData])

    //FETCH INITIAL DATA
    useEffect(() => {
        fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/users`, setValue:setUserData, setWaiting:setWaitingInfo,auth:auth})
        document.title = `Usuarios - Organización - ${auth.authData.organizationName} - Matil`
    }, [])
 
    //CREATE USER BOOLEAN
    const [showCreateNewUser, setShowCreateNewUser] = useState<boolean>(false)

    //DELETE USERS LOGIC
    const [waitingDelete, setWaitingDelete] = useState<boolean>(false)
    const [showConfirmDelete ,setShowConfirmDelete] = useState<boolean>(false)
    const [selectedElements, setSelectedElements] = useState<UserData[]>([])
    const handleCheckboxChange = (element:UserData, isChecked:boolean) => {
        if (isChecked) setSelectedElements(prevElements => [...prevElements, element])
        else setSelectedElements(prevElements => prevElements.filter(el => el !== element))
    }
    const handleDeleteUsers = async() => {
        const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/users`, setWaiting:setWaitingDelete, params:{email:selectedElements[0].email},auth:auth, method:'delete'})
        if (response && response.status === 200) {
            const updatedUserData = userData.filter(user => !selectedElements.map(element => element.email).includes(user.email))
            setUserData(updatedUserData)

            const updatedUsers = { ...auth.authData.users }
            selectedElements.forEach(element => {
                const userKey = Object.keys(auth.authData?.users || []).find(key => auth.authData?.users?.[key]?.email_address === element.email)
                if (userKey) delete updatedUsers[userKey]
            })
            auth.setAuthData({users: updatedUsers})
        }
        setSelectedElements([])
        setShowConfirmDelete(false)
    }

    const memoizedNewUserBox = useMemo(() => (
        <ConfirmBox setShowBox={setShowCreateNewUser} isSectionWithoutHeader={true}> 
            <NewUserBox userData={userData} setUserData={setUserData} setShowCreateNewUser={setShowCreateNewUser}/>
        </ConfirmBox>
    ), [showCreateNewUser])

    const memoizedDeleteBox = useMemo(() => (
        <ConfirmBox setShowBox={setShowConfirmDelete} isSectionWithoutHeader={true}> 
              <Box p='15px'> 
                <Text width={'400px'}  fontWeight={'medium'}>¿Estás seguro que deseas eliminar al siguiente usuario de la organización?</Text>
                <Box maxH='30vh' overflow={'scroll'} mt='2vh'>
                {selectedElements.map((user, index) => (
                    <Fragment key={`delete-elements-${index}`}> 
                        <Text mt='.5vh'fontWeight={'medium'}>{user.name} {user.surname}</Text>
                        <Text mt='.5vh'>{user.email}</Text>
                     </Fragment>
                ))}
                </Box>
                </Box>
                <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                    <Button  size='sm' color='red' _hover={{color:'red.600', bg:'gray.200'}} onClick={handleDeleteUsers}>{waitingDelete?<LoadingIconButton/>:'Eliminar'}</Button>
                    <Button  size='sm' onClick={()=>setShowConfirmDelete(false)}>Cancelar</Button>
                </Flex>
            </ConfirmBox>
    ), [showConfirmDelete])

    return(<>
    <>        
        {showConfirmDelete && memoizedDeleteBox}
        {showCreateNewUser && memoizedNewUserBox}

        <Text fontSize={'1.4em'} fontWeight={'medium'}>Tabla de usuarios</Text>
        <Text color='gray.600' fontSize={'.9em'}>Administra la información de tus usuarios.</Text>

        <Box width='100%' bg='gray.300' height='1px' mt='2vh' mb='5vh'/>
        <Skeleton isLoaded={!waitingInfo}> 
            <Text fontWeight={'medium'} fontSize={'1.2em'}>{userData.length} usuario{userData.length === 1?'':'s'}</Text>
        </Skeleton>

        <Flex  mt='2vh'justifyContent={'space-between'} alignItems={'end'}>
            <Skeleton isLoaded={!waitingInfo}> 
                <Box width={'350px'}> 
                    <EditText value={text} setValue={setText} searchInput={true}/>
                </Box>
            </Skeleton>
            <Flex gap='10px'> 
                {selectedElements.length === 1 && <Button size='sm' color='red' _hover={{color:'red.600', bg:'gray.200'}} leftIcon={<BsTrash3Fill/>} onClick={() => setShowConfirmDelete(true)} >Eliminar usuario</Button>}
                <Button leftIcon={<FaPlus/>} size='sm' onClick={() => {setShowCreateNewUser(!showCreateNewUser)}}>Crear nuevo usuario</Button>
            </Flex>
        </Flex>

        <Skeleton isLoaded={!waitingInfo}> 
            <Box mt='2vh' py='5px'  overflow={'scroll'} maxW={'calc(100vw - 260px - 4vw)'}>
 
            {filteredUserData.length === 0 ? 
            <Box borderRadius={'.5rem'} width={'100%'} bg='gray.50' borderColor={'gray.200'} borderWidth={'1px'} p='15px'>    
                <Text fontWeight={'medium'} fontSize={'1.1em'}>No hay usuarios disponibles</Text>
            </Box>: 
            <> 
                <Flex  borderTopRadius={'.5rem'}  borderColor={'gray.300'} borderWidth={'1px'}  minWidth={'1180px'}  gap='20px' alignItems={'center'}  color='gray.500' p='10px'  bg='gray.100' fontWeight={'medium'} > 
                    <Flex flex='1 0 10px' alignItems={'center'}> 
                        <Checkbox onChange={(e) => setSelectedElements(e.target.checked ? userData.map((item:UserData) => item):[])}/>  
                    </Flex>
                    <Text flex='15 0 150px'>Nombre</Text>
                    <Text flex='20 0 200px'>Apellidos</Text>
                    <Text flex='20 0 200px'>Correo electrónico</Text>
                    <Text flex='9 0 90px'>Rol</Text>
                    <Text flex='6 0 60px'>Estado</Text>
                    <Text flex='35 0 350px'>Código de invitación</Text>
                </Flex>
                {filteredUserData.map((row, index) =>( 
                    <Flex minWidth={'1180px'} borderRadius={index === filteredUserData.length - 1?'0 0 .5rem .5rem':'0'} borderWidth={'0 1px 1px 1px'}  gap='20px' key={`user-${index}`}  bg={selectedElements.includes(row)?'blue.100':'none'} alignItems={'center'}  fontSize={'.9em'} color='black' p='10px'  borderColor={'gray.300'}> 
                        <Box flex='1 0 10px' onClick={(e) => e.stopPropagation()}> 
                            <Checkbox onChange={(e) => handleCheckboxChange(row, e.target.checked)} isChecked={selectedElements.includes(row)}/>  
                        </Box>
                        <Text flex='15 0 150px' whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{row.name}</Text>
                        <Text flex='20 0 200px' textOverflow={'ellipsis'} overflow={'hidden'}>{row.surname}</Text>
                        <Text flex='20 0 200px' textOverflow={'ellipsis'} overflow={'hidden'}>{row.email}</Text>
                        <Box flex='9 0 90px'> 
                        <Text flex='20 0 200px' textOverflow={'ellipsis'} overflow={'hidden'}>{row.is_admin?'Administrador':'Usuario'}</Text>
                         
                        </Box>
                        <Box flex='6 0 60px'> 
                            <Box  display="inline-flex" fontSize='.8em' borderColor={row.is_active?'green.500':'red.600'} borderWidth={'1px'} py='1px' px='5px' fontWeight={'medium'} color='white'  bg={row.is_active?'green.400':'red.500'} borderRadius={'.7rem'}> 
                                <Text>{row.is_active?'Activo':'Inactivo'}</Text>
                            </Box>
                        </Box>

                        <Flex flex='35 0 350px'gap='10px' alignItems={'center'}>
                            <Text textOverflow={'ellipsis'} overflow={'hidden'}>{row.invitation_key}</Text>
                            <Tooltip label={'Copiar código'}  placement='top' hasArrow bg='black' color='white'  borderRadius='.4rem' fontSize='sm' p='6px'> 
                                <IconButton size='xs' onClick={() => copyToClipboard(row.invitation_key)}  aria-label={'copy-invitation-code'} icon={<BsClipboard2Check/>}/>
                            </Tooltip>
                        </Flex>
                    </Flex>
                ))}
            </>}
            </Box>
        </Skeleton>
        </> 
    </>)
}

export default AdminUsers