/* 
    BOX AND BACKGROUND ANIMATION FOR IMPORTANT ACTIONS
*/

//REACT
import { ReactNode, memo } from 'react'
//FRONT
import { motion } from 'framer-motion'
import { Box, Flex } from '@chakra-ui/react'
 
//TYPING
interface ConfirmBoxProps {
    children: ReactNode
    setShowBox:(key:boolean) => void
    isSectionWithoutHeader?:boolean
    maxW?:null | string
    max?:boolean
}

//MANI FUUNCTION
const ConfirmBox = memo(({ children, setShowBox, isSectionWithoutHeader = false, maxW, max = false }:ConfirmBoxProps) => {

    const MotionBox = motion(Box)
    const MotionFlex = motion(Flex)

    return(
        <MotionFlex initial={{opacity:0}}  animate={{opacity:1}} exit={{opacity:0}} transition={{ duration: .2 }} onMouseDown={() => setShowBox(false)} backdropFilter= 'blur(1px)' position='fixed' alignItems='center'justifyContent='center' top={0} left={0} marginLeft={isSectionWithoutHeader?'-60px':'0px'} width='100vw' height='100vh' bg='rgba(0, 0, 0, 0.3)' zIndex= {10000}>
            <MotionBox initial={{opacity:0, y:15}}  animate={{opacity:1, y:0}} transition={{ duration: .2 }} minW='450px' maxW={maxW ?maxW :'600px'} width={max?'600px':'auto'} height={max?'90vh':'auto'} maxH={'90vh'} onMouseDown={(e) => e.stopPropagation()} bg='white' overflow={'hidden'} borderRadius={'1rem'} shadow={'xl'} position={'absolute'}  borderColor='gray.200' borderWidth='1px' zIndex={111}  >
                {children}
            </MotionBox>
        </MotionFlex>
    )
})

export default ConfirmBox