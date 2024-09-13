
//REACT
import  { useState, useEffect, useRef, Dispatch, SetStateAction, useMemo } from 'react'
import { useAuth } from '../../../../AuthContext'
import { useTranslation } from 'react-i18next'
//FETCH DATA
import fetchData from "../../../API/fetchData"
//FRONT
import { Flex, Text, Box, Button, Skeleton, Tooltip, IconButton, Textarea, Avatar, chakra, shouldForwardProp } from "@chakra-ui/react"
import { AnimatePresence, motion, isValidMotionProp } from 'framer-motion'
//COMPONENTS
import EditText from '../../../Components/Reusable/EditText'
import LoadingIconButton from '../../../Components/Reusable/LoadingIconButton'
import useOutsideClick from '../../../Functions/clickOutside'
import ConfirmBox from '../../../Components/Reusable/ConfirmBox'
import showToast from '../../../Components/ToastNotification'
import Table from '../../../Components/Reusable/Table'
//ICONS
import { BsTrash3Fill } from "react-icons/bs"
import { FaPlus } from 'react-icons/fa6'
import { IoIosArrowBack } from 'react-icons/io'


//TYPING
type UserType = {id:number, name:string, surname:string, email:string, is_admin:boolean, is_active:boolean}
interface GroupData  {
    id: number,
    name: string,
    description: string,
    users: UserType[],
}

//MOTION BOX
const MotionBox = chakra(motion.div, {shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop)})

const CellStyle = ({column, element}:{column:string, element:any}) => {
 return <Text whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{column === 'users'?element.map((user:any) => user.name).join(' - '):element}</Text>
}

//MAIN FUNCTION
function Groups () {

    //AUTH CONSTANT
    const auth = useAuth()
    const { t } = useTranslation('settings')
    const groupsMapDict:{[key:string]:[string, number]} = {name:[t('Name'), 150], description: [t('Description'), 350], users:[t('Users'), 500]}
    const newGroup:GroupData = {
        id: -1,
        name: t('NewGroup'),
        description: '',
        users: []
    }
    
    //GROUPS DATA
    const [groupsData, setGroupsData] = useState<GroupData[] | null>(null)

    //SELECTED GROUP
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null)

    //FILTER GROUPS DATA
    const [text, setText]  =useState<string>('')
    const [filteredGroupsData, setFilteredGroupsData] = useState<GroupData[]>([])
      useEffect(() => {
        const filterUserData = () => {
            if (groupsData) {
                const filtered = groupsData.filter(user =>
                    user.name.toLowerCase().includes(text.toLowerCase()) ||
                    user.description.toLowerCase().includes(text.toLowerCase())
                )
                setFilteredGroupsData(filtered)
            }
        }
        filterUserData()
      }, [text, groupsData])


    //FETCH INITIAL DATA
    useEffect(() => {
        fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/groups`, setValue:setGroupsData, auth})
        document.title = `${t('Organization')} - ${t('Groups')} - ${auth.authData.organizationName} - Matil`
    }, [])

    return(<>
        {selectedGroup !== null ? <EditGroup groupData={selectedGroup} setGroupData={setSelectedGroup} setGroupsData={setGroupsData}/>:<>
        <Flex justifyContent={'space-between'} alignItems={'end'}> 
            <Box> 
                <Text fontSize={'1.4em'} fontWeight={'medium'}>{t('GroupsTable')}</Text>
                <Text color='gray.600' fontSize={'.9em'}>{t('GroupsDescription')}</Text>
            </Box>
        </Flex>

        <Box width='100%' bg='gray.300' height='1px' mt='2vh' mb='5vh'/>
        <Skeleton mb='1vh' isLoaded={groupsData !== null}> 
            <Text  fontWeight={'medium'} fontSize={'1.2em'}>{t('GroupsCount', {count:groupsData?.length})}</Text>
        </Skeleton>
 
        <Flex  mt='2vh'justifyContent={'space-between'} alignItems={'end'}>
            <Skeleton isLoaded={groupsData !== null}> 
                <Box width={'350px'}> 
                    <EditText value={text} setValue={setText} searchInput={true}/>
                </Box>
            </Skeleton>
            <Flex gap='10px'> 
                <Button size='sm' leftIcon={<FaPlus/>} onClick={() => setSelectedGroup(newGroup)}>{t('CreateGroup')}</Button>
            </Flex>
        </Flex>

        <Skeleton   mt='2vh'isLoaded={groupsData !== null}> 
            <Table data={filteredGroupsData || []} CellStyle={CellStyle} noDataMessage={t('NoGroups')} columnsMap={groupsMapDict} onClickRow={(row:any, index:number) => setSelectedGroup(row)}/>
        </Skeleton>
        </>}
    </>)
}

const EditGroup = ({groupData, setGroupData, setGroupsData}:{groupData:GroupData, setGroupData:Dispatch<SetStateAction<GroupData | null>>, setGroupsData:Dispatch<SetStateAction<GroupData[] | null>> }) => {

    //CONSTANTS
    const auth = useAuth()
    const { t } = useTranslation('settings')

    //BOX SCROLL REF
    const scrollRef = useRef<HTMLDivElement>(null)

    //BOOLEAN FOR WAIT TO THE SEND GROUP
    const [waitingSend, setWaitingSend] = useState<boolean>(false)

    //BOOLEAN SHOWING DELETE BOX
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false)

    //GROUP DATA
    const groupDataRef = useRef<GroupData>(groupData)
    const [currentGroupData, setCurrentGroupData] = useState<GroupData>(groupData)

    //ADD A USER TO A GROUP
    const addUser = async(user:UserType) => {

        if (groupData.id !== -1) {
            const userResponse = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/admin/settings/groups/${groupData.id}/${user.id}`, method: 'post', auth})
            if (userResponse?.status === 200) {
                setCurrentGroupData(prev => {return {...prev, users:[...prev.users, user ]}})
                setGroupsData(prev => {
                    if (prev) {
                        return prev?.map((group) => {
                            if (group.id === groupData.id) return {...group, users:[...group.users, user ]}
                            else return group
                        })
                    }
                    else return null
                })
            }
        }
        else {
            setCurrentGroupData(prev => {return {...prev, users:[...prev.users, user ]}})
        }
    }

    //DELETE A USER FROM A GROUP
    const deleteUser = async(index:number, userId:number) => {

        if (groupData.id !== -1) {
            const userResponse = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/admin/settings/groups/${groupData.id}/${userId}`, method: 'delete', auth})
            if (userResponse?.status === 200) {
                setCurrentGroupData(prev => {
                    const newUsers = [...prev.users]
                    newUsers.splice(index, 1)
                    return {...prev, users:newUsers}
                })
                setGroupsData(prev => {
                    if (prev) {
                        return prev?.map((group) => {
                            if (group.id === groupData.id) return {...group, users:group.users.splice(index, 1)}
                            else return group
                        })
                    }
                    else return null
                })
            }
        }
        else {
            setCurrentGroupData(prev => {
                const newUsers = [...prev.users]
                newUsers.splice(index, 1)
                return {...prev, users:newUsers}
            })
        }
    }
    
    //EDIT AND CREATE A   GROUP
    const sendEditGroup = async () => {
        setWaitingSend(true)    

        if (groupData.id === -1) {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/groups`, requestForm:{name:currentGroupData.name, description:currentGroupData.description}, method:'post', auth})
            if (response?.status === 200) {
                const assignUserPromises = currentGroupData.users.map(async (user) => {
                    const userResponse = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/admin/settings/groups/${response?.data.id}/${user.id}`, method: 'post',auth})
                    if (userResponse?.status !== 200) throw new Error(`Failed to add user ${user.id}`)
                    return userResponse
                })
                try {
                    await Promise.all(assignUserPromises)
                    showToast({ message: t('CorrectAddedGroup'), type: 'works' })
                    setGroupsData(prev => {
                        if (prev) return [...prev, currentGroupData]
                        else return null
                    })
                    setGroupData(null)
                } 
                catch (error) {showToast({ message: t('FailedToAddSomeUsers'), type: 'failed' })}
            }
            else showToast({message:t('FailedAddedGroup'), type:'failed'})
        } 
        else {
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/groups/${groupData.id}`, requestForm:{name:currentGroupData.name, description:currentGroupData.description}, method:'put', auth, toastMessages:{'works':t('CorrectEditedGroup'),'failed':t('FailedEditedGroup')}})
            if (response?.status === 200) {
                setGroupsData(prev => {
                    if (prev) {
                        return prev?.map((group) => {
                            if (group.id === groupData.id) return currentGroupData
                            else return group
                        })
                    }
                    else return null
                })
                setGroupData(null)
            }
 
        }
        setWaitingSend(false)    

    }
    
    //FIND USER BOX
    const FindUser = () => {

        //OBTAINING A LIST WITH ALL
        const userList = Object.entries(auth?.authData?.users || {}).map(([id, user]) => {return {id: Number(id),  name: user.name, surname: user.surname, email: user.email_address, is_admin: user.is_admin, is_active: !!user.last_login}})
  
        //REFS
        const buttonRef = useRef<HTMLDivElement>(null)
        const boxRef = useRef<HTMLDivElement>(null)
        
        //FILER USERS LIST
        const [text, setText] = useState<string>('')
        const [showResults, setShowResults] = useState<boolean>(false)
        const [filteredUsers, setFilteredUsers] = useState<UserType[]>(userList)

        //BOOLEAN TO CONTROL THE VISIBILITY OF THE LIST AND CLOSE ON OUTSIDE CLICK
        useOutsideClick({ref1:buttonRef, ref2:boxRef, containerRef:scrollRef, onOutsideClick:setShowResults})
    
        useEffect(() => {
            if (text === '') {setShowResults(false)}
            else {
                setShowResults(true)
                const filtered = (userList).filter((user:UserType) => {
                    const fullNameEmail = `${user.name} ${user.email}`.toLowerCase()
                    const userExistsInGroup = currentGroupData.users.some(groupUser => groupUser.id === user.id)
                    return fullNameEmail.includes(text.toLowerCase()) && !userExistsInGroup
                  })
                setFilteredUsers(filtered)
            }
        }, [text])
    
 
     return (
         <Box position={'relative'} maxW={'300px'}>
            <Box > 
                <EditText value={text} setValue={setText} searchInput={true} placeholder={t('FindUser')}/> 
            </Box>
            <AnimatePresence> 
                {showResults && 
                <MotionBox initial={{ opacity: 5, marginTop: -5 }} animate={{ opacity: 1, marginTop: 5 }}  exit={{ opacity: 0,marginTop:-5}} transition={{ duration: '0.2',  ease: '[0.0, 0.9, 0.9, 1.0]'}}
                 maxH='30vh' overflow={'scroll'} width='140%' gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000} position={'absolute'} left={0} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                        <Box maxH='30vh'>
                            {filteredUsers.length === 0? 
                            <Box p='15px'><Text fontSize={'.9em'} color='gray.600'>{t('NoCoincidence')}</Text></Box>
                            :<> 
                            {filteredUsers.map((user:UserType, index:number) => (
                                <Flex _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'} onClick={() => {setText('');setShowResults(false);addUser(user)}} key={`user-${index}`} p='10px' gap='10px' >
                                    <Avatar size='sm'/>
                                    <Box>
                                        <Text fontWeight={'medium'} fontSize={'.9em'}>{user.name} {user.surname}</Text>
                                        <Text fontSize={'.9em'}>{user.email}</Text>
                                    </Box>
                                </Flex>
                            ))}</>}
                        </Box>
                      
                 
                </MotionBox>} 
            </AnimatePresence>
         </Box>
     )
    }

    //DELETE BOX COMPONENT
    const DeleteComponent = () => {

        //WAITING DELETION
        const [waitingDelete, setWaitingDelete] = useState<boolean>(false)

        //FUNCTION FOR DELETING AN AUTOMATION
        const deleteGroup = async () => {
            setWaitingDelete(true)
            const response = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/settings/groups/${groupData.id}`, setWaiting:setWaitingDelete, method:'delete', auth, toastMessages:{works:t('CorrectDeletedGroup'), failed:t('FailedDeletedGroup')}})
            if (response?.status == 200) {
                setGroupData(null)
                setGroupsData(prev => {
                    if (prev) return prev.filter((group) => group.id !== groupData.id)
                    else return null
                })
            }             
        }

        //FRONT
        return(<>
            <Box p='15px'> 
                <Text fontWeight={'medium'} fontSize={'1.2em'}>{t('ConfirmDelete')}</Text>
                <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
                <Text >{t('ConfirmDeleteGroup')}</Text>
            </Box>
            <Flex p='15px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
                <Button  size='sm' colorScheme='red' onClick={deleteGroup}>{waitingDelete?<LoadingIconButton/>:t('Delete')}</Button>
                <Button  size='sm' onClick={() => setShowConfirmDelete(false)}>{t('Cancel')}</Button>
            </Flex>
        </>)
    }

    //DELETE BOX
    const memoizedDeleteBox = useMemo(() => (
        <ConfirmBox isSectionWithoutHeader={true} setShowBox={setShowConfirmDelete}> 
            <DeleteComponent/>
        </ConfirmBox>
    ), [showConfirmDelete])


    //FRONT
    return (  <>
    {showConfirmDelete && memoizedDeleteBox}
 
    <Flex height={'100%'} minH='90vh'  width={'100%'} flexDir={'column'}> 
        <Flex flexDir={'column'} flex='1'  py='2px'> 
            <Flex justifyContent={'space-between'} alignItems={'center'}> 
                <Flex gap='20px' alignItems={'center'}> 
                    <Tooltip label={'Atrás'}  placement='bottom' hasArrow bg='black'  color='white'  borderRadius='.4rem' fontSize='.75em' p='4px'> 
                        <IconButton aria-label='go-back' size='sm' bg='transparent' border='none' onClick={() => setGroupData(null)} icon={<IoIosArrowBack size='20px'/>}/>
                    </Tooltip>
                    <Box minW='500px'> 
                        <EditText nameInput={true} size='md' value={currentGroupData.name} setValue={(value) => {setCurrentGroupData((prev) => ({...prev, name:value}))}}/>
                    </Box>
                </Flex>
                {groupDataRef.current.id !== -1 && <Button  color='red' leftIcon={<BsTrash3Fill/>} onClick={() => setShowConfirmDelete(true)}>{t('DeleteGroup')}</Button>}
            </Flex>
            <Text fontSize={'1.1em'} mt='2vh' mb='1vh'  fontWeight={'medium'}>{t('Description')}</Text>
            <Textarea resize={'none'} maxLength={2000} height={'auto'} placeholder={`${t('Description')}...`} maxH='300px' value={currentGroupData.description} onChange={(e) => setCurrentGroupData((prev) => ({...prev, description:e.target.value}))} p='8px'  borderRadius='.5rem' fontSize={'.9em'}  _hover={{border: "1px solid #CBD5E0" }} _focus={{p:'7px',borderColor: "rgb(77, 144, 254)", borderWidth: "2px"}}/>

            <Box width={'100%'} mt='2vh' mb='2vh' height={'1px'} bg='gray.300'/>   
            <Box flex={1} >
                <Text mb='1vh' fontSize={'1.1em'}  fontWeight={'medium'}>{t('AddUsersGroup')}</Text>
                <FindUser/>
                <Box maxW={'600px'} mt='3vh' borderTopColor={'gray.300'} borderWidth={'1px 0 0 0'}> 
                    {currentGroupData.users.length === 0 ?<Text mt='2vh'>{t('NoUsers')}</Text>:<>
                    {currentGroupData.users.map((user, index) => (
                    <Flex justifyContent={'space-between'} borderBottomColor={'gray.300'} borderBottomWidth={'1px'} _hover={{bg:'gray.50'}} cursor={'pointer'} alignItems={'center'}  key={`user-selected-${index}`} p='10px' gap='10px' >
                        <Flex  gap='10px'> 
                            <Avatar size='sm'/>
                            <Box>
                                <Text fontWeight={'medium'} fontSize={'.9em'}>{user.name} {user.surname}</Text>
                                <Text fontSize={'.9em'}>{user.email}</Text>
                            </Box>
                        </Flex>
                        <IconButton aria-label='delete-user' icon={<BsTrash3Fill/>} size='sm' bg='transparent' color='red' onClick={() => deleteUser(index, user.id)}/>
                    </Flex>
                    ))}</>}
                </Box>
            </Box>
 
       </Flex>

        <Box width={'100%'} mb='2vh' height={'1px'} bg='gray.300'/>
        <Flex flexDir = 'row-reverse'>
            <Button onClick={sendEditGroup} isDisabled={currentGroupData.name === ''  || currentGroupData.users.length === 0 || ((JSON.stringify(currentGroupData) === JSON.stringify(groupDataRef.current)))}>{waitingSend?<LoadingIconButton/>:t('SaveChanges')}</Button>
        </Flex>

    </Flex>
    </>)
}

export default Groups