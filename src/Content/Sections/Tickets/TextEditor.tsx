/*
    FUNCTION TO WRITE AND SEND THE MESSAGES WITH PURE HTML (tickets/ticket/{ticket_id})
 */

//REACT
import { useState, useRef, useCallback, useMemo, Fragment, useEffect } from 'react'
import { useAuth } from '../../../AuthContext'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../../SessionContext'
import { useTranslation } from 'react-i18next'
//FRONT
import { Box, Flex, Button, IconButton, Icon, Text, Avatar, Image, Portal } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import '../../Components/styles.css'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
//FETCH DATA
import fetchData from '../../API/fetchData'
import LoadingIconButton from '../../Components/LoadingIconButton'
//EDIT PURE HTML COMPONENTS
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import '../../Components/styles.css'
//FUNCTION
import useOutsideClick from '../../Functions/clickOutside'
import formatFileSize from '../../Functions/formatFileSize'
//ICONS
import { HiOutlinePaperClip, HiOutlineEmojiHappy } from "react-icons/hi"
import { IoArrowUndoSharp } from "react-icons/io5"
import { IoIosArrowDown } from 'react-icons/io'
import { PiTextTBold } from "react-icons/pi"
import { FaRegEdit } from "react-icons/fa"
import { RxCross2 } from "react-icons/rx"
//TYPING
import { DeleteHeaderSectionType, TicketsTableProps, statesMap,  TicketData } from '../../Constants/typing'
   
//TYPING
interface TextEditorProps {
    clientName:string | undefined
    ticketData:TicketData
    updateData:(section:'ticket' | 'client', newData?:TicketData | null) => {}
    deleteHeaderSection: DeleteHeaderSectionType
    takeConversationControl:() => void
}

//MOTION BOX
const MotionBox = motion(Box)

//MAIN FUNCTION
function TextEditor({clientName, ticketData, updateData, deleteHeaderSection, takeConversationControl }:TextEditorProps) {

    //TRANSLATION
    const { t } = useTranslation('tickets')

    //AUTH CONSTANT
    const auth = useAuth()
    const session = useSession()
    const navigate = useNavigate()

    //SEND PANEL REF, FOR HIDDING THE BOX ON SCROLL
    const sendPanelRef = useRef<HTMLDivElement>(null)

    //SEND LIKE BOX LOGIC
    const sendLikeButtonRef = useRef<HTMLDivElement>(null)
    const sendLikeBoxRef = useRef<HTMLDivElement>(null)
    const [showSendLike, setShowSendLike] = useState<boolean>(false)
    useOutsideClick({ref1:sendLikeButtonRef, ref2:sendLikeBoxRef,containerRef:sendPanelRef, onOutsideClick:setShowSendLike})

    //ACTION BOX LOGIC
    const actionNoteRef = useRef<HTMLDivElement>(null)
    const actionBoxRef = useRef<HTMLDivElement>(null)
    const [showChangeAction, setShowChangeAction] = useState<boolean>(false)
    const [sendAction, setSendAction] = useState<'next' | 'close' | 'mantain'>(localStorage.getItem('sendAction')? localStorage.getItem('sendAction') as 'next' | 'close' | 'mantain':'close')
    useOutsideClick({ref1:actionNoteRef, ref2:actionBoxRef, containerRef:sendPanelRef, onOutsideClick:setShowChangeAction})

    //INTERNAL NOTES
    const noteRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const [isInternalNote, setIsInternalNote] = useState<boolean>(false)
    const [showSelector, setShowSelector] = useState<boolean>(false)
    useOutsideClick({ref1:noteRef, ref2:boxRef,  onOutsideClick:setShowSelector})

    //WAITING TO SEND A MESAGE
    const [waitingSend, setWaitingSend] = useState<boolean>(false)

    //ATTACHMENTS FILES
    const [attachmentsFiles, setAttachmentsFiles] = useState<File[]>([])

    //EDITING THE BOX HEIGHT WITH THE CURSOR
    const [height, setHeight] = useState<number>(ticketData?.channel_type === 'email' ? 400: 300)
    const handleMouseDown = useCallback((event:any) => {
        const startHeight = height
        const startY = event.pageY
        const handleMouseMove = (e:any) => {
            const newHeight = startHeight - (e.pageY - startY)
            setHeight(newHeight > 50 ? newHeight : 50)
        }
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    },[height])

    //MESSAGE TO SEND (IT WILL BE HTML IF MAIL AND NORMAL TEXT IN THE OTHER CASES)
    const [htmlValue, setHtmlValue] = useState<string>('')
    const htmlValueRef = useRef<string>(htmlValue)
    useEffect(() => {htmlValueRef.current = htmlValue}, [htmlValue])
    const [textValue, setTextValue] = useState<string>('')
    const textValueRef = useRef<string>(textValue)
    useEffect(() => {textValueRef.current = textValue}, [textValue])

    //INPUTS REFS
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const quillRef = useRef<ReactQuill>(null)

    //SHORTCUTS LOGIC
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false)
    const [filteredShortcuts, setFilteredShortcuts] = useState<string[]>([])
    const [cursorPosition, setCursorPosition] = useState<{bottom:number, left:number}>({ bottom: 0, left: 0 })

    //SHOW THE SHORTCUTS BOX
    const handleShortcuts = (content:string, selection:{index:number}) => {
        
        const shortCutsList = auth.authData.shortcuts
        const cursorIndex = selection.index
        const textBeforeCursor = content.slice(0, cursorIndex) || ''
        const lastWord = textBeforeCursor.split(' ').pop() || ''
       
        const search = lastWord.slice(1).toLowerCase()
        const matches = shortCutsList.filter(s => s.toLowerCase().includes(search))
        
        setFilteredShortcuts(matches)
        setShowShortcuts(matches.length > 0 && lastWord.startsWith('/'))

        if (lastWord.startsWith('/') && textAreaRef.current && ticketData?.channel_type !== 'email') {
    
            const textArea = textAreaRef.current
            const start = textArea.selectionStart;

            const createMirrorDiv = () => {
                const div = document.createElement('div')
                const style = window.getComputedStyle(textArea)
                div.style.position = 'absolute'
                div.style.visibility = 'hidden'
                div.style.whiteSpace = 'pre-wrap'
                div.style.wordWrap = 'break-word'
                div.style.fontFamily = style.fontFamily
                div.style.fontSize = style.fontSize
                div.style.fontWeight = style.fontWeight
                div.style.fontStyle = style.fontStyle
                div.style.letterSpacing = style.letterSpacing
                div.style.padding = style.padding
                div.style.border = style.border
                div.style.width = `${textArea.clientWidth}px`
                div.style.lineHeight = style.lineHeight
                return div
            }

            const mirrorDiv = createMirrorDiv()
            mirrorDiv.textContent = textArea.value.substring(0, start)
            const span = document.createElement('span')
            span.textContent = textArea.value.substring(start) || '.'
            mirrorDiv.appendChild(span)
            document.body.appendChild(mirrorDiv)
            const textAreaBounds = textArea.getBoundingClientRect();
            const mirrorBounds = mirrorDiv.getBoundingClientRect();
            const spanBounds = span.getBoundingClientRect();
            const cursorTop = textAreaBounds.top + (spanBounds.top - mirrorBounds.top) - textArea.scrollTop;
            const cursorLeft = textAreaBounds.left + (spanBounds.left - mirrorBounds.left) - textArea.scrollLeft;
            document.body.removeChild(mirrorDiv);

            setCursorPosition({bottom: window.innerHeight - cursorTop, left: cursorLeft})
        }
        else if (lastWord.startsWith('/') && quillRef.current) {
            const editor = quillRef.current.getEditor()
            const bounds = editor.getBounds(cursorIndex)

            const quillContainer = editor.root;
            const containerBounds = quillContainer.getBoundingClientRect();

            const cursorTop = bounds.top + containerBounds.top + window.scrollY;
            const cursorLeft = bounds.left + containerBounds.left + window.scrollX;

            setCursorPosition({ bottom: window.innerHeight - cursorTop, left: cursorLeft })
        }
    }

    //WRITE THE SELECTED SHORTCUT
    const handleSelectShortcut = (text:string) => {
        if (quillRef.current && ticketData?.channel_type === 'email') {
          const editor = quillRef.current.getEditor()
          const cursorPosition = editor?.getSelection()?.index;
          const textBeforeCursor = htmlValue.slice(0, cursorPosition)
          const textAfterCursor = htmlValue.slice(cursorPosition);
          const textBeforeLastWord = textBeforeCursor.replace(/\/\S+$/, '')
          const newText = textBeforeLastWord + text + textAfterCursor
          setHtmlValue(newText)
          const newCursorPosition = (textBeforeLastWord.length || 0) + text.length
          editor.setSelection({ index: newCursorPosition, length: 0 })
        }
        else if (textAreaRef.current) {
          const cursorPosition = textAreaRef.current.selectionStart
          const textBeforeCursor = textValue.slice(0, cursorPosition)
          const textAfterCursor = textValue.slice(cursorPosition)
          const textBeforeLastWord = textBeforeCursor.replace(/\/\S*$/, '')
          const newText = textBeforeLastWord + text + textAfterCursor
          setTextValue(newText)
          textAreaRef.current.setSelectionRange(textBeforeLastWord.length + text.length, textBeforeLastWord.length + text.length)
        }
        setShowShortcuts(false)
    }

    //MAIL MESSAGES LOGIC 
     const handleEmojiClick = (emojiObject: EmojiClickData, event: any) => {
        if (ticketData?.channel_type  === 'email'  && quillRef.current) {
            const quill = quillRef.current.getEditor()
            const range = quill.getSelection(true)
            if (range) quill.insertText(range.index, emojiObject.emoji)
        }
        else if (ticketData?.channel_type !== 'email'  && textAreaRef.current) {
            const start = textAreaRef.current.selectionStart
            const end = textAreaRef.current.selectionEnd
            const text = htmlValue
            const before = text.substring(0, start)
            const after  = text.substring(end, text.length)
            setHtmlValue(before + emojiObject.emoji + after)
        }
    }

    //SHOW AND HIDE TOOLBARS    
    const emojiBoxRef = useRef<HTMLDivElement>(null)
    const emojiButtonRef = useRef<HTMLButtonElement>(null)
    const [toolbarVisible, setToolbarVisible] = useState<boolean>(false)
    const [emojiVisible, setEmojiVisible] = useState<boolean>(false)
    useOutsideClick({ref1:emojiBoxRef, ref2:emojiButtonRef,onOutsideClick:setEmojiVisible })

    const fontSizeArr = ['8px','9px','10px','12px','14px','16px','20px','24px','32px','42px','54px','68px','84px','98px']
    var Size = Quill.import('attributors/style/size')
    Size.whitelist = fontSizeArr;
    Quill.register(Size, true)
    const modules = {
        toolbar: [
        [{ 'size': fontSizeArr}],  
        ['bold', 'italic', 'underline'], 
        ['blockquote', 'code-block'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link']
        ]
    }

    //SEND A MESSAGE
    const sendMessage = async (type:string, content:any)=> {

        let messageContent = {type:type, content:content}
        if (type === 'plain') messageContent = {type, content:{text:textValueRef.current}}
        else if (type === 'email') {
            const sendAttachments = await Promise.all(
                attachmentsFiles.map(async (file) => {
                    const urlInfo = await getPreSignedUrl(file, true)
                    return urlInfo
                })
            )
            messageContent = {type, content: {subject:ticketData?.title, html:htmlValueRef.current, text:textValueRef.current, attachments:sendAttachments} }
            setHtmlValue('')
            setAttachmentsFiles([])
        }
        
        else {
            const fileContent = await getPreSignedUrl(content, true)
            messageContent = {type, content:fileContent}
        }

        setTextValue('')
        const response = await fetchData({endpoint:`conversations/${ticketData?.conversation_id}`, setWaiting:setWaitingSend, requestForm:{is_internal_note:isInternalNote,...messageContent}, method:'post', auth, toastMessages:{'failed':t('MessageSentFailed'), 'works':t('MessageSent')}})
        
        if (response?.status === 200) {
            if (sendAction === 'close') {
                navigate('/tickets')
                deleteHeaderSection({description:'', code:ticketData?.id || -1, local_id:ticketData?.local_id, type:'ticket' })
            }
            else if (sendAction === 'next') {
                const currentView =  JSON.parse(localStorage.getItem('currentView') || 'null')
                if (currentView) {
                    const currentTable = session.sessionData.ticketsTable.find((element) => (element.view.view_type === currentView.type && element.view.view_index === currentView.index ) )
                    if (currentTable) {
                        const findIndexTicketIndex =  currentTable.data.page_data.findIndex((ticket:TicketsTableProps) => (ticketData?.id === ticket.id)) + 1
                        if (findIndexTicketIndex >= currentTable.data.page_data.length) navigate(`/tickets/ticket/${currentTable.data.page_data[0].id}`)
                        else navigate(`/tickets/ticket/${currentTable.data.page_data[findIndexTicketIndex].id}`)
                    }
                }
            }
        }   

    }
    
    //SELECT A FILE
    const handleFileSelect = async (e: any) => {

        const files = e.target.files
        const maxFileSize = 10 * 1024 * 1024
        if (files) {
            const selectedFilesArray = Array.from(files) as File[]
            if (ticketData?.channel_type === 'email') setAttachmentsFiles((prev: File[]) => [...prev, ...selectedFilesArray]);
            else {
                const file = selectedFilesArray[0] as File
                if (file.size > maxFileSize) return
                let fileType = 'file'
                if (file.type.startsWith('image/')) fileType = 'image'
                else if (file.type === 'application/pdf') fileType = 'pdf'
                else if (file.type.startsWith('video/')) fileType = 'video'
                sendMessage(fileType, file)
            }
         }
    }

    //PRE-SIGNED URSLS LOGIC
    const getPreSignedUrl = async (file:File, isMail:boolean) => {
        const response = await fetchData({endpoint: `superservice/${auth.authData.organizationId}/s3_pre_signed_url`, method:'post', auth:auth, requestForm: { file_name: file.name, channel_type:ticketData?.channel_type}})   
        if (response?.status === 200) {
            const responseUpload = await fetch(response.data.upload_url, {method: "PUT", headers: {}, body: file})
            if (responseUpload.ok) {
                if (isMail) return {url: response.data.access_url, file_name: file.name, size:file.size, type:file.type}       
                else return {url: response.data.access_url, object_uuid: response.data.object_uuid, file_name: file.name, file_size:file.size}
            }
            else  new Error('Failed to upload file.')
        }
    }

    //TOTAL SIZE OF THE ATTACHMENTS FILES
    const totalSize = attachmentsFiles.reduce((acc, file) => acc + file.size, 0)
    
    //COMPONENTS FOR EACH ATTACHMENT FILE
    const AttachmentFilesComponent =  useMemo(() =>  ({file, index}:{file:File, index:number}) => {

        //STYLES CONSTANTS
        const fileTypeColors:{[key: string]: string} = {'PDF':'red.500', 'DOCX':'blue.600', 'ZIP':'orange.500'}
        const fileType = file.name.split('.')[1].toUpperCase()
        const imageUrl = useMemo(() => URL.createObjectURL(file), [file])

        //IS HOVERING BOOLEAN
        const [isHovering, setIsHovering] = useState<boolean>(false)

        //REMOVE FILEW
        const removeFileAtIndex = () => {setAttachmentsFiles(currentFiles => currentFiles.filter((_, idx) => idx !== index));}

        return (

            <Flex  bg={fileTypeColors[fileType] || 'gray.100'} color={fileType in fileTypeColors?'white':'black'} position='relative' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} key={`attachment-file-${index}`} cursor={'pointer'} height={'100px'} width={'140px'}  borderColor={'gray.200'} borderWidth={'1px'} justifyContent={'center'} alignItems={'center'}>
                {file.type.startsWith('image/') ? 
                    <Image objectFit='cover' objectPosition='center' src={imageUrl} height={'100%'} width={'100%'} />
                    :
                    <Text fontWeight={'medium'} fontSize='1.2em'>{file.name.split('.')[1].toUpperCase()}</Text>
                }
                <AnimatePresence> 
                    {isHovering && 
                        <MotionBox p='5px'  overflow={'hidden'} alignItems={'center'} position='absolute' bottom={0} width={'100%'} display={'flex'} gap='5px' bg='blackAlpha.700' color='white' initial={{bottom:-50}} animate={{bottom:0}} exit={{bottom:-50}}  transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0] }} >
                            <Text fontWeight={'medium'} fontSize={'.8em'} flex='1' minW={0} whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{file.name}</Text>
                            <Icon boxSize='16px' onClick={removeFileAtIndex} as={RxCross2} color='white' borderRadius={'.2rem'} p='2px' _hover={{bg:'gray.600'}}/>
                        </MotionBox>}
                </AnimatePresence>
            </Flex>
            )
    }, [])

    //HANDLE CHANGE OF TEXT AND HTML VALUE
    const handleChange = (content:any, delta:any, source:any, editor:any) => {
        const cursorIndex = editor.getSelection().index
        const text = editor.getText()

        handleShortcuts(text, {index: cursorIndex}) 
        setHtmlValue(content)

        setTextValue(text)
    }

    //HANDLE SEND A TEXT MESSAGE
    const handleButtonClick = (state:'new' | 'open' | 'pending' |  'solved' | 'closed') => {
        setShowSendLike(false)
        updateData('ticket', {...ticketData as TicketData, 'status':state})

        if (totalSize < 10 * 1024 * 1024 && (textValueRef.current !== '' || htmlValueRef.current !== '')) {
            if (ticketData?.channel_type !== 'email') sendMessage('plain', textValueRef.current)
            else sendMessage('email', htmlValueRef.current)
        }
    }

 
    
    // Efecto para escuchar los eventos del teclado
    useEffect(() => {
        const handleKeyPress = (event:KeyboardEvent) => {
             if (!showShortcuts) {
                if (event.key === 'Enter' && !(event.metaKey || event.ctrlKey)) {
                    handleButtonClick('pending')
                    event.preventDefault()
                    event.stopPropagation()
                } 
                else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                 
                    event.preventDefault()
                    event.stopPropagation()
                    if (ticketData?.channel_type !== 'email' && textAreaRef.current) {
                        const start = textAreaRef.current.selectionStart
                        const end = textAreaRef.current.selectionEnd
                        const text = textValueRef.current
                        const before = text.substring(0, start)
                        const after = text.substring(end, text.length)
                        setTextValue(before + '\n' + after)
                        setTimeout(() => {
                            if (textAreaRef.current) {
                                textAreaRef.current.selectionStart = start + 1;
                                textAreaRef.current.selectionEnd = start + 1;
                            }
                        }, 0)
                    } else if (ticketData?.channel_type === 'email' && quillRef.current) {
                        const quill = quillRef.current.getEditor();
                        const range = quill.getSelection(true);
                        if (range) {
                            quill.insertText(range.index, '\n');
                        }
                    }
                }
                else if (event.metaKey || event.ctrlKey) {
                    if (event.code === 'KeyR'){
                        setIsInternalNote(false)
                        setShowSelector(false)
                    }
                    else if (event.code === 'KeyN'){
                        setIsInternalNote(true)
                        setShowSelector(false)
                    }
                    else if (event.code === 'KeyO') handleButtonClick('open')
                    else if (event.code === 'KeyP') handleButtonClick('pending')
                    else if (event.code === 'KeyS') handleButtonClick('solved')
                }

            }
        }
        document.addEventListener('keydown', handleKeyPress)
        return () => {document.removeEventListener('keydown', handleKeyPress)}
    }, [showShortcuts, ticketData])
   
    const ShortCutsBox = ({ shortcuts, onSelect, position }:{shortcuts:string[], onSelect:any, position:any }) => {

        const selectedItemRef = useRef<number>(0)
        const [selectedItem, setSelectedItem] = useState<number>(0)
        useEffect(() => {selectedItemRef.current = selectedItem}, [selectedItem])

        useEffect(() => {
            
            const handleKeyDown = (event:KeyboardEvent) => {

                if (event.key === 'ArrowDown' ||event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Enter' ){
                    event.preventDefault()
                    event.stopPropagation()
                }
                if (event.key === 'ArrowDown') setSelectedItem((prev) => (prev + 1) % shortcuts.length)
                else if (event.key === 'ArrowUp') setSelectedItem((prev) => (prev - 1 + shortcuts.length) % shortcuts.length)
                else if (event.key === 'Enter') onSelect(shortcuts[selectedItemRef.current])  
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => {window.removeEventListener('keydown', handleKeyDown)}
        }, [])

        return(
            <Box position={'fixed'}fontSize={'.85em'} left={position.left} bottom={position.bottom} maxH='40vh' maxW={'400px'} overflow={'scroll'}  boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                {shortcuts.length === 0 ? <Text color='gray.600'>No hay atajos definidos</Text>:<>
                {shortcuts.map((shorcut, index) => (
                    <Flex key={`shorcut-${index}`} bg={selectedItem === index?'brand.hover_gray':'white'} cursor={'pointer'} p='5px' _hover={{bg:'brand.hover_gray'}} onClick={() => onSelect(shorcut)} alignItems={'center'}>
                        {shorcut}
                    </Flex>
                ))}</>}
            </Box>
        )
    }
    
    //FRONT
    return (<> 
    {showShortcuts && (<ShortCutsBox shortcuts={filteredShortcuts} onSelect={handleSelectShortcut} position={cursorPosition} />)}
        <input id='selectFile' type="file" multiple={ticketData?.channel_type === 'email'} style={{display:'none'}}   onChange={(e)=>{handleFileSelect(e)}} accept=".pdf, .doc, .docx, image/*" />

            {(ticketData?.user_id === -1 || ticketData?.status === 'closed' ) ?
                <Flex gap='20px' zIndex={10} justifyContent={'center'} alignItems={'center'} py='20px' bg='gray.50' borderTopColor={'gray.200'} borderTopWidth={'1px'}>
                    <Text >{ticketData?.status === 'closed' ?'El ticket está cerrado, no se pueden enviar más mensajes'  :'El ticket está siendo gestionado por Matilda'}</Text>
                    {(ticketData?.user_id === -1 && ticketData?.status !== 'closed' ) && <Button fontSize={'1em'} borderRadius={'2em'} onClick={takeConversationControl} bg={'brand.gradient_blue'} _hover={{bg:'brand.gradient_blue_hover'}} color='white' size='sm'>{t('TakeControl')}</Button>}
                </Flex>:
            <Box position={'relative'} bg={isInternalNote?'yellow.100':''} minH={'150px'} maxH={'600px'} height={`${height}px`} borderTopColor={'gray.200'} borderTopWidth={'1px'}> 
                <Box height={'10px'}  onMouseDown={handleMouseDown} cursor='ns-resize'/>
                    <Flex pt='5px' gap='10px' pb='15px' px='15px' alignItems={'center'} justifyContent={'space-between'}> 
                        <Flex alignItems={'center'} gap='9px' maxW={'100%'}>
                            <Portal > 
                                {showSelector &&
                                    <MotionBox ref={boxRef} initial={{ opacity: 0, marginBottom: -10}} animate={{ opacity: 1, marginBottom: 0 }}  exit={{ opacity: 0, marginBottom: -10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}} 
                                    fontSize={'.8em'} overflow={'hidden'} bottom={window.innerHeight -  (noteRef.current?.getBoundingClientRect().top || 0) + 10}  left={noteRef.current?.getBoundingClientRect().left} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                                        <Flex p='10px' alignItems={'center'} gap='7px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} onClick={() => {setIsInternalNote(true);setShowSelector(false)}}>
                                            <Icon as={FaRegEdit}/>
                                            <Text whiteSpace={'nowrap'}>{t('InternalNote')}</Text>
                                        </Flex>
                                        <Flex p='10px' alignItems={'center'} gap='7px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} onClick={() => {setIsInternalNote(false);setShowSelector(false)}}>
                                            <Icon as={IoArrowUndoSharp}/>
                                            <Text whiteSpace={'nowrap'}>{t('Public')}</Text>
                                        </Flex>
                                    </MotionBox>
                                }
                            </Portal > 
                            <Flex ref={noteRef} cursor={'pointer'} gap='5px' alignItems={'center'} onClick={() => setShowSelector(!showSelector)}> 
                                <Icon as={isInternalNote?FaRegEdit:IoArrowUndoSharp} color='gray.400' boxSize={'15px'}/>
                                <Text color='gray.600' fontSize={'.8em'} whiteSpace={'nowrap'}>{isInternalNote?t('InternalNote'):t('Public')}</Text>
                                <Icon  color='gray.600'className={ showSelector? "rotate-icon-up" : "rotate-icon-down"} as={IoIosArrowDown} boxSize={'13px'}/>
                            </Flex>
                               
                           
                            <Text color='gray.500' fontSize={'.8em'}>|</Text>
                            <Text color='gray.500' fontSize={'.8em'}>{t('For')}</Text>
                            <Flex flex='1' minW={0}   alignItems={'center'} gap='4px' borderColor={'gray.400'} bg='gray.100' px='5px' py='1px' borderWidth={'1px'} borderRadius={'2em'}>
                                <Avatar height='10px' width={'10px'}/>
                                <Text fontSize={'.7em'} color='gray.600' whiteSpace={'nowrap'} textOverflow={'ellipsis'} overflow={'hidden'}>{clientName}</Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    {ticketData?.channel_type === 'email' ? 
                    <> 
                    {attachmentsFiles.length > 0 && <>
                        <Box px='20px'  > 
                            <Flex  overflowX={'scroll'} width={'100%'}> 
                                <Flex  gap='10px' >
                                    {attachmentsFiles.map((file, index) => (<Fragment key={`attachment-${index}`}> <AttachmentFilesComponent file={file} index={index}/></Fragment>))}
                                </Flex>
                            </Flex>
                            <Text mt='1vh' color={totalSize > 10 * 1024 * 1024 ? 'red':'black'} mb='1vh' fontSize={'.9em'}>Tamaño del correo: <span style={{fontWeight:'500'}}> {formatFileSize(totalSize)}</span> {totalSize > 10 * 1024 * 1024 && '(sólo se permite enviar un máximo de 10 MB)'}</Text>
                        </Box>
                        <Box height={'1px'} bg='gray.300' width={'100%'}/>
                    </>}
                    <ReactQuill modules={modules} ref={quillRef} theme="snow" value={htmlValue} onChange={handleChange} className={toolbarVisible ? '' : 'hidden-toolbar'} style={{ height: '100%', display: 'flex', flexDirection: 'column-reverse'}} />
                    </>
                    :
                    <textarea ref={textAreaRef} value={textValue} onChange={(e) => {setTextValue(e.target.value); handleShortcuts(e.target.value, {index: e.target.selectionStart}) }}  style={{ height: '100%', width: '100%', padding:'20px', background:'transparent', outline: 'none', border:'none', resize:'none', fontSize:'.9em'}} />
                    }
                    <Flex overflowX={'scroll'}  ref={sendPanelRef} maxW={'100%'} justifyContent={'space-between'} position={'absolute'} bottom={0} px='15px' py='10px' gap='15px' alignItems={'center'} borderTopColor={'gray.100'} borderTopWidth={'1px'} bg='gray.50' width={'100%'}>
                        <Flex gap='10px'> 
                            {ticketData?.channel_type === 'email' && <IconButton aria-label='edit-text' bg='transparent' icon={<PiTextTBold/>} size='sm' onClick={() => {setEmojiVisible(false);setToolbarVisible(!toolbarVisible)}} />}
                            <IconButton aria-label='edit-text' icon={<HiOutlinePaperClip/>} size='sm' bg='transparent' onClick={() => document.getElementById('selectFile')?.click()}/>
                            <IconButton ref={emojiButtonRef} aria-label='edit-text' icon={<HiOutlineEmojiHappy/>} size='sm'  bg='transparent' onClick={()=>{setToolbarVisible(false);setEmojiVisible(!emojiVisible)}}  />
                        </Flex>
                        <Flex gap='10px' alignItems={'center'}  > 
                            <Box position={'relative'}>  
                                {showChangeAction &&  
                                <Portal > 
                                    <MotionBox  bottom={window.innerHeight -  (actionNoteRef.current?.getBoundingClientRect().top || 0) + 10}  right={window.innerWidth - (actionNoteRef.current?.getBoundingClientRect().right || 0)}  ref={actionBoxRef} initial={{ opacity: 0, marginBottom: -10}} animate={{ opacity: 1, marginBottom: 0 }}  exit={{ opacity: 0, marginBottom: -10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}} 
                                        fontSize={'.8em'} overflow={'hidden'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={1000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                                        <Flex p='7px' alignItems={'center'} gap='7px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} onClick={() => {setShowChangeAction(false);setSendAction('close');localStorage.setItem('sendAction','close')}}>
                                            <Text whiteSpace={'nowrap'}>{t('CloseAction_1')}</Text>
                                        </Flex>
                                        <Flex p='7px' alignItems={'center'} gap='7px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} onClick={() => {setShowChangeAction(false);setSendAction('next');localStorage.setItem('sendAction','next')}}>
                                            <Text whiteSpace={'nowrap'}>{t('CloseAction_2')}</Text>
                                        </Flex>
                                        <Flex p='7px' alignItems={'center'} gap='7px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} onClick={() => {setShowChangeAction(false);setSendAction('mantain');localStorage.setItem('sendAction','mantain')}}>
                                            <Text whiteSpace={'nowrap'}>{t('CloseAction_3')}</Text>
                                        </Flex>
                                    </MotionBox>
                                </Portal>}
                    
                                <Flex ref={actionNoteRef} fontSize={'.7em'}  cursor={'pointer'} gap='5px' alignItems={'center'} onClick={() => setShowChangeAction(!showChangeAction)}> 
                                    <Text  whiteSpace={'nowrap'}>{sendAction === 'close'?t('CloseAction_1'):sendAction === 'next'?t('CloseAction_2'):t('CloseAction_3')}</Text>
                                    <Icon className={ showChangeAction? "rotate-icon-up" : "rotate-icon-down"} as={IoIosArrowDown} boxSize={'13px'}/>
                                </Flex>
                            </Box>

                            <Box position={'relative'} >  
                                {showSendLike &&  
                                    <Portal > 
                                        <MotionBox bottom={window.innerHeight - (sendLikeButtonRef.current?.getBoundingClientRect().top || 0) + 10}  right={window.innerWidth - (sendLikeButtonRef.current?.getBoundingClientRect().right || 0)} ref={sendLikeBoxRef} initial={{ opacity: 0, marginBottom: -10}} animate={{ opacity: 1, marginBottom: 0 }}  exit={{ opacity: 0, marginBottom: -10}} transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}} 
                                            fontSize={'.8em'} overflow={'hidden'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={1000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>
                                        {Object.keys(statesMap).map((state, index) => (
                                            (state !== 'closed' && state !== 'new') && 
                                                <Flex alignItems='center' key={`state-${index}`}  onClick={() => handleButtonClick(state as 'new' | 'open' | 'pending' | 'solved' | 'closed')} py='7px' px='20px' gap='10px' cursor={'pointer'} _hover={{bg:'brand.hover_gray'}} >
                                                    <Box height={'10px'} width={'10px'} borderRadius={'.1rem'} bg={statesMap[state as 'new' | 'open' | 'pending' | 'solved' | 'closed'][0]}/>
                                                    <Text fontWeight={'medium'} whiteSpace={'nowrap'}>{t(state)}</Text>
                                                </Flex>
                                            ))}
                                        </MotionBox>
                                    </Portal > }

                                <Flex cursor={'pointer'} gap='1px' >
                                    <Flex  onClick={() => handleButtonClick('pending')} bg={'brand.gradient_blue'} px='10px' py='5px' borderRadius={'.5em 0 0 .5em'} color='white' _hover={{bg:'brand.gradient_blue_hover'}}>
                                        {waitingSend?<LoadingIconButton/> :
                                        <Flex alignItems={'center'} gap='10px'>
                                            <Text whiteSpace={'nowrap'}  fontWeight={'medium'} fontSize={'.9em'} color='gray.200'>{t('SendLike')} <span style={{fontWeight:'500', color:'white'}}>{t(ticketData.status)}</span></Text>
                                        </Flex>}
                                    </Flex>
                                    <Flex ref={sendLikeButtonRef} onClick={() => {setShowSendLike(!showSendLike)}} bg={'linear-gradient(to right, rgba(51, 153, 255, 1), rgba(0, 102, 204, 1))'} justifyContent={'center'} px='7px'  borderRadius={'0 .5rem .5rem 0'} alignItems={'center'} color='white' _hover={{bg:'linear-gradient(to right, rgba(51, 133, 255, 1),rgba(0, 72, 204, 1))'}}>
                                        <Icon className={ showSendLike? "rotate-icon-up" : "rotate-icon-down"} as={IoIosArrowDown} boxSize={'13px'}/>
                                    </Flex>         
                                </Flex>

                            </Box>
                         </Flex>
                    </Flex>
            </Box>}
             
 
            {emojiVisible &&<Box position={'fixed'} bottom={window.innerHeight - (emojiButtonRef?.current?.getBoundingClientRect().top || 0) + 2} left={emojiButtonRef?.current?.getBoundingClientRect().left} zIndex={1000} ref={emojiBoxRef}> <EmojiPicker onEmojiClick={handleEmojiClick}  allowExpandReactions={false}/></Box>}
            </>)
}

export default TextEditor
