/*
    SETITNGS SECTION 
*/

//REACT
import  { Suspense, useEffect, lazy, useRef, Fragment } from "react"
import { Routes, Route,  useNavigate, useLocation } from "react-router-dom" 
import { useAuth } from "../../../AuthContext"
import { useTranslation } from 'react-i18next'
//FRONT
import { Box, Flex, Text, Icon } from '@chakra-ui/react'
import '../../Components/styles.css'
//ICONS
import { IconType } from "react-icons"
import { IoPerson } from "react-icons/io5"
import { BsLightningFill } from "react-icons/bs"
import { BiSolidBuildings } from "react-icons/bi"
import { FaDoorOpen, FaPlug } from "react-icons/fa"
import { HiChatAlt2 } from "react-icons/hi"
import { FaDiagramProject } from "react-icons/fa6"
//TYPING
import { IconKey, SubSectionProps, SectionsListProps } from "../../Constants/typing"

//MAIN
const Main = lazy (() => import('./Main')) 
//ORGANIZATION
const Data = lazy(() => import('./Organization/Data'))
//const Payments = lazy(() => import('./Organization/Payments'))
const AdminUsers = lazy(() => import('./Organization/AdminUsers'))
const Groups = lazy(() => import('./Organization/Groups'))
//RULES
const TicketsData = lazy(() => import('./Rules/TicketsData'))
const Surveys = lazy(() => import('./Rules/Surveys'))
const Fields = lazy(() => import('./Rules/Fields'))
//PERSONAL
const User = lazy(() => import('./User/User'))
const ViewsList = lazy(() => import('./User/Views'))
const EditView = lazy(() => import('./User/EditView'))
const Shortcuts = lazy(() => import('./User/Shortcuts'))
//ACTIONS
const Triggers = lazy(() => import('./Actions/Triggers'))
const Automations = lazy(() => import('./Actions/Automations'))
//CHANNELS
const Chatbot = lazy(() => import('./Channels/Chatbot'))
const Google = lazy(() => import('./Channels/Google'))
const Mail = lazy(() => import('./Channels/Mail'))
const Instagram = lazy(() => import('./Channels/Instagram'))
const Whatsapp = lazy(() => import('./Channels/Whatsapp'))
const Phone = lazy(() => import('./Channels/Phone'))
//INTEGRATIOSN
const Shopify = lazy(() => import('./Integrations/Shopify'))


interface ExpandableSectionProps {
    section: IconKey
    subSections: SubSectionProps
  }
  
const Section = ({ section, subSections }: ExpandableSectionProps) => {
    
    //TRANSLATION
    const { t } = useTranslation('settings')

    //CONSTANTS
    const navigate = useNavigate()
    const selectedSection = useLocation().pathname.split('/')[2]
    const selectedSubSection = useLocation().pathname.split('/')[3]
    const sectionsList: SectionsListProps = {'organization':t('Organization'), 'user':t('User'), 'rules':t('BusinessRules'),  'actions':t('Actions'), 'channels': t('Channels'), 'integrations':t('Integrations'),'main':t('Main')}
    const iconsMap: Record<IconKey, IconType> = {organization: BiSolidBuildings, rules:FaDiagramProject, user: IoPerson, actions:BsLightningFill, channels: HiChatAlt2, integrations:FaPlug, main:FaDoorOpen}

    //NAVIGATE
    const navigateToSection = (section:string) => {
        navigate(section)
        localStorage.setItem('currentSettingsSection',section)
    }
    return(<> 
        {section === 'main' ? 
         <Flex gap='10px' p='5px' _hover={{ color:'black'}} color={selectedSection === 'main'?'black':'gray.500'}  fontWeight={selectedSection === 'main'?'medium':'normal'}  onClick={() => {navigateToSection('main')}}  bg={selectedSection === 'main'?'gray.100':'transparent'} cursor={'pointer'} alignItems={'center'} borderRadius={'.5rem'}>
            <Icon boxSize={'15px'} as={iconsMap[section]}/>
            <Text >{sectionsList[section]}</Text>
        </Flex>:
       <Flex mt='1vh' gap='10px' p='5px' _hover={{ color:'black'}} color={selectedSection === section?'black':'gray.500'}  fontWeight={selectedSection === section?'medium':'normal'}  onClick={() => {navigateToSection(`${section}/${subSections[0][1]}`)}}  cursor={'pointer'}  alignItems={'center'} borderRadius={'.5rem'}>
            <Icon boxSize={'16px'} as={iconsMap[section]}/>
            <Text >{sectionsList[section]}</Text>
        </Flex>}
 
        {subSections.map((sec, index) => (
            <Flex  key={`${section}-${sec}-${index}`} p='4px'  color={selectedSubSection === sec[1]?'black':'gray.600'} fontWeight={selectedSubSection === sec[1]?'medium':'normal'}  bg={selectedSubSection === sec[1]?'gray.200':'transparent'} _hover={{color:'black'}} onClick={() => navigateToSection(`${section}/${sec[1]}`)} alignItems={'center'} cursor={'pointer'} borderRadius='.3rem'fontSize={'.9em'}   justifyContent={'space-between'}    >
                <Text fontSize={'.95em'} ml='25px'  >{sec[0]}</Text>
            </Flex>  
        ))}
    </>)
    }


function Settings () {

    //TRANSLATION
    const { t } = useTranslation('settings')

    //SECTIONS
    const auth = useAuth()
    const isAdmin = auth.authData.users?.[auth.authData?.userId || '']?.is_admin

    //SUBSECTINOS
    const subSections: SubSectionProps[] = [
        [[t('Data'), 'data'], [t('Users'),'admin-users'], [t('Groups'),'groups']],
        [[t('Views'), 'edit-views'], [t('Shortcuts'), 'shortcuts']],
        [[t('Tickets'), 'tickets'], [t('Fields'), 'fields'],[t('Surveys'), 'surveys']],
        [[t('Triggers'), 'triggers'], [t('Automations'), 'automations']],
        [[t('Web'),'web'], ['Whatsapp','whatsapp'],['Instagram','instagram'], ['Google Business','google-business'], [t('Mail'),'mail']],
        [['Shopify','shopify']]
    ] 
    
    const sectionsList: (IconKey | '')[] = isAdmin ? ['organization', 'user', 'rules', 'actions', 'channels', 'integrations'] : ['user']

    //CONSTANTS
    const navigate = useNavigate()
    const location = useLocation().pathname
 
    //SCROLL REF 
    const scrollRef = useRef<HTMLDivElement>(null)

    //NAVUGATE TO CURRENT SECTION
    useEffect(() => {
        const section = localStorage.getItem('currentSettingsSection')
        localStorage.setItem('currentSection', 'settings')
        if (location.split('/')[location.split('/').length - 1] === 'settings' && !window.location.hash.substring(1)) navigate(section !== null ? section : 'main')
    }, [])
   
    return( 
    <Flex>  
        <Flex flexDir="column" height={'100vh'} py="5vh" px='15px'  bg='#f1f1f1' width='220px' borderRightWidth="1px" borderRightColor="gray.200">
            <Text fontSize={'1.2em'} fontWeight={'medium'}>{t('Settings')}</Text>
            <Box height={'1px'} width={'100%'} bg='gray.300' mt='2vh' mb='2vh'/>
            <Section  section={'main'} subSections={[]}  />
            <Box overflowY="auto" flex="1">
                {sectionsList.map((section, index) => (<Fragment  key={`settings-section-${index}`} > 
                    {section !== '' &&<Section section={section} subSections={subSections[index]}  />}
                </Fragment>))}
            </Box>
        </Flex>

        <Box width={'calc(100vw - 275px)'} position={'relative'} bg='white' px='2vw' height={'100vh'} overflow={'scroll'} ref={scrollRef}>
            <Box py='5vh'> 
                <Suspense fallback={<></>}>    
                    <Routes >
                        <Route path="/main" element={<Main subSections={subSections} sectionsList={sectionsList}/>} />
                        
                        <Route path="/organization/data" element={<Data />} />
                        <Route path="/organization/admin-users" element={<AdminUsers />} />
                        <Route path="/organization/groups" element={<Groups />} />

                        <Route path="/user/user" element={<User />} />
                        <Route path="/user/edit-views" element={<ViewsList />} />
                        <Route path="/user/edit-views/edit/*" element={<EditView scrollRef={scrollRef}/>} />
                        <Route path="/user/shortcuts" element={<Shortcuts/>} />

                        <Route path="/rules/tickets" element={<TicketsData />} />
                        <Route path="/rules/fields" element={<Fields/>} />
                        <Route path="/rules/surveys" element={<Surveys scrollRef={scrollRef}/>} />
                        
                        <Route path="/actions/triggers" element={<Triggers scrollRef={scrollRef}/>} />
                        <Route path="/actions/automations" element={<Automations scrollRef={scrollRef}/>} />

                        <Route path="/channels/web" element={<Chatbot />} />
                        <Route path="/channels/whatsapp" element={<Whatsapp />} />
                        <Route path="/channels/phone" element={<Phone />} />
                        <Route path="/channels/instagram/*" element={<Instagram />} />
                        <Route path="/channels/google-business" element={<Google />} />
                        <Route path="/channels/mail" element={<Mail />} />

                        <Route path="/integrations/shopify" element={<Shopify />} />

                    </Routes>
                </Suspense>
            </Box>   
        </Box>
        
    </Flex>)
}

export default Settings