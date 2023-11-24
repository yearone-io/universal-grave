import React from 'react';
import { Box, Button, Step, StepDescription, StepIcon, StepIndicator, StepNumber, StepSeparator, StepStatus, StepTitle, Stepper, Text, VStack, useColorModeValue, useSteps } from '@chakra-ui/react';
import JoinGraveBtn from './JoinGraveBtn';

const JoinGravePannel: React.FC = () => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200'); // Adjusts color based on the theme
  
  const steps = [
    { title: '1. Give your 🆙 necessary permissions', description: 'todo: display Browser Extension address' },
    { title: '2. Create your GRAVE spam box', description: 'Bla bla' },
    { title: '3. Link GRAVE to your 🆙', description: 'Bla bla' },
    { title: '4. Enable GRAVE to keep assets inventory', description: 'Bla bla' },
    { title: '5. Direct all 🆙 spam to the GRAVE', description: 'Bla bla' },
  ]

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
      width='full' // Take the full width of the parent
      textAlign='center'
      padding='20px'
      h='400px'
    >
      <Text fontSize='2xl' fontWeight='bold' fontFamily='Roboto' >
        SET UP YOUR GRAVE SPAM BOX
      </Text>
      < JoinGraveBtn onJoiningStepChange={(newStep: number) => {setActiveStep(newStep)} } />
          <Stepper index={activeStep} orientation='vertical' height='100px' gap='0'>
            {steps.map((step, index) => (
                <Step key={index}>
                <StepIndicator>
                    <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                    />
                </StepIndicator>

                <Box flexShrink='0'>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                </Box>

                <StepSeparator />
                </Step>
            ))}
            </Stepper>
    </VStack>
  );
};

export default JoinGravePannel;
