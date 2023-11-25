import React from 'react';
import { Box, Button, Step, StepDescription, StepIcon, StepIndicator, StepNumber, StepSeparator, StepStatus, StepTitle, Stepper, Text, VStack, useColorModeValue, useSteps } from '@chakra-ui/react';
import JoinGraveBtn from './JoinGraveBtn';
import { FaCheckCircle } from 'react-icons/fa';

const JoinGravePannel: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  const [steps, setSteps] = React.useState([
    { 
      title: 'Give your 🆙 necessary permissions', 
      description: 'Give permissions to your Browser Extension Controller.', 
      description2: 'This can also be done manually.' 
    },
    { title: 'Create your GRAVE spam box'},
    { title: 'Link GRAVE to your 🆙'},
    { title: 'Enable GRAVE to keep assets inventory' },
    { title: 'Direct all 🆙 spam to the GRAVE' },
  ])


  const displayTruncatedAddress = (address: string) => {
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  }

  // notes:
  // step 1 needs address for incomplete
  // step 2 neeeds address for complete
  const handleNewStep = (newStep: number, data: any) => {
    console.log('new step', newStep, data)
    let modifiedSteps = [...steps]
    if (newStep === 0 && data[0]) {
      // Set initial state of step 0 since it needs the Browser Extension Controller address
      modifiedSteps[0].description2 = `This can also be done manually. (${displayTruncatedAddress(data[0])})`
    } else if (newStep >= 1 && data[1]) {
      modifiedSteps[0].description = `PERMISSION SET `
      modifiedSteps[0].description2 = '';
      modifiedSteps[1].description = `ADDRESS: ${displayTruncatedAddress(data[1])} ` 
    }
    setSteps(modifiedSteps)
    setActiveStep(newStep)
  }
  

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  return (
    <VStack
      spacing={4}
      p={5}
      backgroundColor={bgColor}
      boxShadow='md'
      borderRadius='lg'
      width='500px'
      textAlign='center'
      padding='20px'
      h='400px'
      color={useColorModeValue('black', 'black')}
    >
      <Text fontSize='2xl' fontWeight='bold' fontFamily='Roboto' >
        SET UP YOUR GRAVE SPAM BOX
      </Text>
      < JoinGraveBtn onJoiningStepChange={handleNewStep} />
          <Stepper index={activeStep} orientation='vertical' height='200px' gap='2' id='grave-step-indicator'>
            {steps.map((step, index) => (
                <Step key={index}  >
                <StepIndicator color='dark.purple.500' borderColor='dark.purple.500' >
                    <StepStatus  
                    complete={'🪦'}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                    />
                </StepIndicator >
                <Box flexShrink='0' textAlign={'left'}>
                    <StepTitle style={{color: 'dark.purple.500'}}>{step.title}</StepTitle>
                    <StepDescription >{step.description}</StepDescription>
                    <StepDescription >{step.description2}</StepDescription>
                </Box>
                <StepSeparator style={{color: 'dark.purple.500', backgroundColor: 'dark.purple.500'}} />
                </Step>
            ))}
            </Stepper>
    </VStack>
  );
};

export default JoinGravePannel;
