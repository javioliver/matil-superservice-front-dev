import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Dispatch, SetStateAction, useRef, useState, useEffect } from "react"
import { useAuth } from "../../../AuthContext"
//FETCH DATA
import fetchData from "../../API/fetchData"
//FRONT
import { Text, Box, Icon, Flex, Button, Grid, Portal } from "@chakra-ui/react"
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
//COMPONENTS
import LoadingIconButton from "../../Components/Reusable/LoadingIconButton"
import EditText from "../../Components/Reusable/EditText"
//FUNCTIONS
import useOutsideClick from "../../Functions/clickOutside"
//ICONS
import { IconType } from "react-icons"
import { IoBook } from "react-icons/io5"
import { FaFolder, FaLock, FaFileLines } from "react-icons/fa6"
  
import { Folder } from "../../Constants/typing"

interface CreateFolderData {
    currentFolder:Folder | null
    type:'edit' | 'add'
    parentId:string | null
    setShowCreate:Dispatch<SetStateAction<boolean>>
    onFolderUpdate:(type: 'edit' | 'add' | 'delete', newFolderData: Folder, parentId: string | null) => void
}

//CREATE A CONTENT TYPE (ARTICLE OR TEXT)
export const CreateBox = () => {

    const { t } = useTranslation('knowledge')
    const navigate = useNavigate()
    const contentList:{type:'internal_article' | 'public_article' | 'text', title:string, description:string, icon:IconType}[] = [
        {type:'public_article',title:t('PublicArticles'), description:t('PublicArticlesDes'), icon:IoBook},
        {type:'internal_article',title:t('PrivateArticles'), description:t('PrivateArticlesDes'), icon:FaLock},
        {type:'text',title:t('TextFragments'), description:t('TextFragmentsDes'), icon:FaFileLines},
    ]   
    const onClickNewCreate = (type:'internal_article' | 'public_article' | 'text' ) => {
        if (type === 'text') navigate(`text/create`)
        else  navigate(`/knowledge/article/create-${type === 'internal_article'?'internal':'public'}`)
    }

    return (<>
        <Box p='20px' > 
            <Text fontWeight={'medium'} fontSize={'1.3em'}>{t('AddContent')}</Text>
        </Box>
        <Box p='30px' bg='brand.gray_2'>
            <Grid  mt='1vh' width={'100%'} gap={'20px'} justifyContent={'space-between'} templateColumns='repeat(3, 1fr)'> 
                {contentList.map((con, index) => ( 
                    <Box onClick={() => onClickNewCreate(con.type)} transition={'box-shadow 0.3s ease-in-out'} key={`select-content-${index}`} _hover={{shadow:'lg'}} cursor={'pointer'} bg='white' p='15px' borderRadius={'.7rem'}>
                        <Box>
                            <Flex display={'inline-flex'} bg='brand.black_button' p='10px' borderRadius={'full'} >
                                <Icon boxSize={'17px'} color='white' as={con.icon}/>
                            </Flex>
                            <Text mt='1vh' fontSize={'1.2em'} fontWeight={'medium'}>{con.title}</Text>
                        </Box>
                        <Text fontSize={'.9em'} mt='1vh' color='gray.600'>{con.description}</Text>
                    </Box>
                ))}
            </Grid>
        </Box>
    </>)
}

//CREATE AND EDIT FOLDERS
export const CreateFolder= ({currentFolder, type, setShowCreate, parentId, onFolderUpdate}:CreateFolderData) => {

    const { t } = useTranslation('knowledge')
    const auth = useAuth()

    //REFS
    const emojiButtonRef = useRef<HTMLDivElement>(null)
    const emojiBoxRef = useRef<HTMLDivElement>(null)
    const [emojiVisible, setEmojiVisible] = useState<boolean>(false)
    useOutsideClick({ref1:emojiButtonRef, ref2:emojiBoxRef, onOutsideClick:setEmojiVisible})
    const handleEmojiClick = (emojiObject: EmojiClickData) => {setFolderEmoji(emojiObject.emoji)}
    const [loadingEmojiPicker, setLoadingEmojiPicker] = useState<boolean>(true); // Para controlar la carga del emoji picker


    const [waitingCreate, setWaitingCreate] = useState<boolean>(false)
    const [folderEmoji, setFolderEmoji] = useState<string>(currentFolder?currentFolder.emoji:'')
    const [folderName, setFolderName] = useState<string>(currentFolder?currentFolder.name:'')

    //FUNCTION FOR CREATE A NEW BUSINESS
    const createFolder= async () => {
        const folderData = await fetchData({endpoint:`superservice/${auth.authData.organizationId}/admin/knowledge/folders${currentFolder?`/${currentFolder.uuid}`:''}`, method:currentFolder?'put':'post', setWaiting:setWaitingCreate, requestForm:{name:folderName, emoji:folderEmoji, parent_uuid:parentId}, auth, toastMessages:{'works': currentFolder?t('CorrectEditedFolder'): t('CorrectCreatedFolder'), 'failed': currentFolder?t('FailedEditedFolder'):t('FailedtCreatedFolder')}})
        if (folderData?.status === 200) {
            const updatedFolder:Folder = currentFolder
                ? { ...currentFolder, name: folderName, emoji: folderEmoji }
                : { uuid:folderData?.data.uuid || '32je', name: folderName, emoji: folderEmoji, children:[]}
            onFolderUpdate(type, updatedFolder, parentId)
        }
        setShowCreate(false)
        }
     

    useEffect(() => {
        const loadEmojiPicker = async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
            setLoadingEmojiPicker(false)
        }
        loadEmojiPicker()
    }, [])

    return(<> 
        <Box p='20px' maxW='450px'> 
            <Text fontWeight={'medium'} fontSize={'1.2em'}>{currentFolder?t('EditFolder'):t('CreateFolder')}</Text>
            <Box width={'100%'} mt='1vh' mb='2vh' height={'1px'} bg='gray.300'/>
            <Flex alignItems={'center'} gap='10px'> 
                <Flex cursor={'pointer'} ref={emojiButtonRef} onClick={() => setEmojiVisible(true)} alignItems={'center'} justifyContent={'center'} width={'40px'} height={'40px'} borderWidth={'1px'} borderColor={'gray.300'} borderRadius={'.5rem'}> 
                    {folderEmoji ? <Text fontSize={'1.2em'}>{folderEmoji}</Text>:<Icon boxSize={'20px'} as={FaFolder}/>}
                </Flex>
                <EditText placeholder={t('FolderName')} hideInput={false} value={folderName} setValue={setFolderName}/>
            </Flex>
        </Box>
        <Flex  maxW='450px' p='20px' mt='2vh' gap='15px' flexDir={'row-reverse'} bg='gray.50' borderTopWidth={'1px'} borderTopColor={'gray.200'}>
            <Button  size='sm' variant={'main'} isDisabled={folderName === ''} onClick={createFolder}>{waitingCreate?<LoadingIconButton/>:currentFolder?t('EditFolder'):t('CreateFolder')}</Button>
            <Button  size='sm' variant={'common'} onClick={() => {setShowCreate(false)}}>{t('Cancel')}</Button>
        </Flex>
        {!loadingEmojiPicker && <Portal> 
            <Box position={'fixed'} pointerEvents={emojiVisible?'auto':'none'}    transition='opacity 0.2s ease-in-out' opacity={emojiVisible ? 1:0} top={`${(emojiButtonRef?.current?.getBoundingClientRect().top || 0)}px`} right={`${window.innerWidth - (emojiButtonRef?.current?.getBoundingClientRect().left || 0) + 5}px`} zIndex={1000} ref={emojiBoxRef}> <EmojiPicker onEmojiClick={handleEmojiClick}  allowExpandReactions={false}/></Box>
        </Portal>}
    </>)
}
