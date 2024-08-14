/*
    BUTTON TO MAKE ACTIONS ON THE TICKET TABLE
*/

//REACT
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../AuthContext'
import { useTranslation } from 'react-i18next'
//FRONT
import { Button, Flex, Text, Icon } from '@chakra-ui/react'
import { motion } from 'framer-motion'
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
            <Button  ref={buttonRef} leftIcon={<IoIosArrowDown className={showList ? "rotate-icon-up" : "rotate-icon-down"}/>} fontSize={'1em'} size='sm'  onClick={() => {setShowList(!showList)}} _hover={{color:'blue.500'}}>
                {t('Actions')}
            </Button>
            {showList && 
 
                <motion.div initial={{marginTop:20, opacity:0}} animate={{marginTop:40, opacity:1}} exit={{marginTop:20, opacity:0}}   transition={{ duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0],   opacity: {duration: 0.2 }, marginTop: {duration: 0.2,  ease: [0.0, 0.9, 0.9, 1.0]}}}
                style={{ boxShadow:'0px 0px 10px rgba(0, 0, 0, 0.2)', fontSize:'.9em',background:'white', borderRadius:'.3rem', borderWidth:'1px', borderColor:'#CBD5E0', zIndex:5, position:'absolute', overflow:'hidden'}} ref={boxRef}   >
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
                </motion.div >
            }
        </Flex>
    )
}

export default ActionsButton