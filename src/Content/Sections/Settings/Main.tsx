
//REACT
import  { Fragment, useEffect } from 'react'
import { useNavigate } from "react-router-dom" 
import { useAuth } from '../../../AuthContext'
import { useTranslation } from 'react-i18next'
//FRONT
import { Flex, Text, Box, Icon, Grid } from "@chakra-ui/react"
//ICONS
import { IconType } from "react-icons"
import { IoPeopleSharp } from "react-icons/io5"
import { BiSolidBuildings } from "react-icons/bi"
import { FaDoorOpen, FaPlug } from "react-icons/fa"
import { HiChatAlt2 } from "react-icons/hi"
import { FaDiagramProject } from "react-icons/fa6"
//TYPING
import { IconKey, SubSectionProps, SectionsListProps } from "../../Constants/typing"
 
interface MainProps {
    subSections: SubSectionProps[]
    sectionsList: (IconKey | '')[] 
}
interface SectionBoxProps {
    section: IconKey
    subSections: SubSectionProps
}

//MAIN FUNCTION
function Main ({subSections, sectionsList}:MainProps) {
   
    //TRANSLATION
    const { t } = useTranslation('settings')

    const auth = useAuth()
    useEffect (() => {
        document.title = `Ajustes - Inicio - ${auth.authData.organizationName} - Matil`
    }, [])

    //COMPONENT FOR EACH BOX SECTION
    const SectionBox = ({section, subSections}:SectionBoxProps) => {
        const sectionsMap: SectionsListProps = {'organization':t('Organization'),'user':t('Personal'), 'rules':t('Rules'), 'channels': t('Channels'), 'integrations':t('Integrations'),'main':t('Main')}
        const iconsMap: Record<IconKey, IconType> = {organization: BiSolidBuildings, user: IoPeopleSharp, rules:FaDiagramProject, channels: HiChatAlt2, integrations:FaPlug, main:FaDoorOpen}

        const sectionsExplanationMap: SectionsListProps = {'organization':t('Organization_Exp'),'user':t('Personal_Exp'), 'rules':t('Rules_Exp'),'channels': t('Channels_Exp'),'integrations':t('Integrations_Exp'), 'main':t('Main')}
      
        const navigate = useNavigate()

        return(
        <Box p='20px' bg='gray.50' borderColor={'gray.300'} borderWidth='1px' borderRadius={'.5rem'}>
            <Flex alignItems={'center'} gap='10px' color='gray.600'> 
                <Icon boxSize='20px' as={iconsMap[section]}/>
                <Text fontSize={'1.4em'} fontWeight={'medium'}>{sectionsMap[section]}</Text>
            </Flex>
            <Text color='gray.600' mb='2vh' fontSize={'.9em'} >{sectionsExplanationMap[section]}</Text>
            {subSections.map((sec, index) =>(<Text cursor={'pointer'}  ml='8px' key={`${section}-${sec}-${index}`}color='blue.600' _hover={{color:'blue.700'}} mt='1vh' onClick={() => {navigate(`/settings/${section}/${sec[1]}`);localStorage.setItem('currentSettingsSection',`${section}/${sec[1]}`)}} >{sec[0]}</Text>))}
        </Box>)
    }
  
    return(<>       
        <Text fontSize={'1.6em'} fontWeight={'medium'}>Configuración de la Aplicación</Text>
        <Text fontSize={'1em'} color='gray.600'>Aquí podrá ajustar las opciones para gestionar su cuenta, personalizar la aplicación y mucho más.</Text>
        <Box height={'1px'} width={'100%'} bg='gray.300' mt='2vh' mb='2vh'/>
        <Grid width={'100%'} maxW={'800px'} gap={'20px'} templateColumns='repeat(2, 1fr)'> 
            {sectionsList.map((section, index) => (<Fragment key={`settings-section-${index}`} > 
                {section !== '' &&<SectionBox  section={section} subSections={subSections[index]} />}
            </Fragment>))}
        </Grid>
    </>)
}

export default Main