/*
    BUTTON TO MAKE ACTIONS ON THE TICKET TABLE
*/

//REACT
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../AuthContext'
import { useTranslation } from 'react-i18next'
//FRONT
import { Button, Flex, Text, Icon, chakra, shouldForwardProp } from '@chakra-ui/react'
import { motion, isValidMotionProp, AnimatePresence } from 'framer-motion'
import '../../Components/styles.css'
//FUNCTIONS
import useOutsideClick from '../../Functions/clickOutside'
//ICONS
import { BsFiletypeCsv } from "react-icons/bs"
import { FaRegEdit } from "react-icons/fa"
import { FaRegClone } from "react-icons/fa6"
import { IoIosArrowDown } from "react-icons/io"
//TYPING
import { ViewType } from '../../Constants/typing'
 
//TYPING
interface Item {
    [key: string]: any
}
interface ButtonProps {
    items: Item[] | undefined
    view: ViewType | null
    section: 'clients' | 'tickets' | 'flows'
}
interface downloadCSVProps {
    items:  Item[] | undefined
    view: string
    section: 'clients' | 'tickets' | 'flows'
}

//FUNCTION FOR DOWNLOAD TO CSV A TABLE
function downloadCSV({items, view, section}:downloadCSVProps) {
    if (items === undefined || items.length === 0) {return}
    const headers = Object.keys(items[0]);
    const csvRows = [headers]
    items.forEach(item => {
        const values = headers.map(header => {
            const escaped = ('' + item[header]).replace(/"/g, '\\"')
            return `"${escaped}"`
        })
        csvRows.push(values)
    })
    const csvString = csvRows.map(e => e.join(",")).join("\n")
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${section}-${view}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

//MOTION BOX
const MotionBox = chakra(motion.div, {shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop)})

//MAIN FUNCTION
const ActionsButton = ({items, view, section}:ButtonProps) =>{
    
    //TRANSLATION
    const { t } = useTranslation('tickets')

    //CONSTANTS
    const navigate = useNavigate()
    const auth = useAuth()
    const isAdmin = auth.authData.users?.[auth.authData?.userId || '']?.is_admin

    //SHOW AND HIDE LIST LOGIC
    const buttonRef = useRef<HTMLButtonElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const [showList, setShowList] = useState(false)
    useOutsideClick({ref1:buttonRef, ref2:boxRef, onOutsideClick:setShowList})

    //FUNCTIONS
    const handleDownloadCSV = useCallback(() => {
        downloadCSV({ items, view: view ?view.name : 'Tabla', section })
        setShowList(false)
    }, [items, view, section])
    const handleEditView = useCallback(() => {
        if (section === 'tickets' && view) navigate(`/settings/people/edit-views/edit/${view.type}/${view.index}`)
    }, [navigate, section, view])
    const handleCloneView = useCallback(() => {
        if (section === 'tickets' && view) navigate(`/settings/people/edit-views/edit/${view.type}/${view.index}/copy`)
    }, [navigate, section, view])

    //FRONT
    return (
        <Flex position={'relative'} flexDir='column' alignItems={'end'}>  
            <Button size='sm'  ref={buttonRef} leftIcon={<IoIosArrowDown className={showList ? "rotate-icon-up" : "rotate-icon-down"}/>}variant='common' onClick={() => {setShowList(!showList)}} >
                {t('Actions')}
            </Button>
            <AnimatePresence> 
                {showList && 
                    <MotionBox initial={{ opacity: 0, marginTop: -5 }} animate={{ opacity: 1, marginTop: 5 }}  exit={{ opacity: 0,marginTop: -5}} transition={{ duration: '.2', ease: 'easeOut'}}
                    maxH='40vh' overflow={'scroll'} top='100%' gap='10px' ref={boxRef} fontSize={'.9em'} boxShadow={'0px 0px 10px rgba(0, 0, 0, 0.2)'} bg='white' zIndex={100000}   position={'absolute'} borderRadius={'.3rem'} borderWidth={'1px'} borderColor={'gray.300'}>

                        <Flex onClick={handleDownloadCSV}  cursor={'pointer'}  px='15px' py='10px' gap='10px' alignItems={'center'} _hover={{bg:'gray.100'}}>
                            <Icon as={BsFiletypeCsv}/>
                            <Text whiteSpace={'nowrap'}>{t('CSV')}</Text>
                        </Flex>
                
                        {(section === 'tickets' && view?.type !== 'deleted' && !(!isAdmin && view?.type === 'shared')) &&<>
                        <Flex onClick={handleEditView} px='15px' py='10px' cursor={'pointer'} gap='10px' alignItems={'center'} _hover={{bg:'gray.100'}}>
                            <Icon as={FaRegEdit}/>
                            <Text whiteSpace={'nowrap'}>{t('EditView')}</Text>
                        </Flex>
                        <Flex  onClick={handleCloneView} px='15px' py='10px'cursor={'pointer'} gap='10px' alignItems={'center'} _hover={{bg:'gray.100'}}>
                            <Icon as={FaRegClone}/>
                            <Text whiteSpace={'nowrap'}>{t('CloneView')}</Text>
                        </Flex></> }
                    </MotionBox >
                }
            </AnimatePresence>
        </Flex>
    )
}

export default ActionsButton