import React, { useContext } from 'react';
import {
  Box,
  Flex,
  Image,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  VStack,
  useColorModeValue,
  useSteps,
} from '@chakra-ui/react';
import JoinGraveBtn from './JoinGraveBtn';
import { FaCheckCircle } from 'react-icons/fa';
import { WalletContext } from '@/components/wallet/WalletContext';
import { formatAddress } from '@/utils/tokenUtils';

const initialSteps = [
  {
    title: 'Give your 🆙 necessary permissions',
    instructions: 'Give permissions to your Browser Extension Controller.',
    instructions2: { text: 'This can also be done manually.', address: null },
    completeText: { text: 'PERMISSION SET', address: null },
    complete: false,
  },
  {
    title: 'Set your GRAVE spambox',
    completeText: { text: 'ADDRESS: ', address: null },
    complete: false,
  },
  {
    title: 'Direct all 🆙 spam to the GRAVE',
    completeText: { text: 'SPAM IS DEAD', address: null },
    complete: false,
  },
];

const initialLeavingSteps = [
  {
    title: 'Give your 🆙 necessary permissions',
    instructions: 'Give permissions to your Browser Extension Controller.',
    instructions2: { text: 'This can also be done manually.', address: null },
    completeText: { text: 'PERMISSION SET', address: null },
    complete: false,
  },
  {
    title: 'Revert to sending all LSP7 and LSP8 assets directly to your UP!',
    complete: false,
  },
];

const JoinGravePanel: React.FC = () => {
  const walletContext = useContext(WalletContext);
  const { networkConfig } = walletContext;
  const logoPath = '/images/logo-full.png';

  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  const [steps, setSteps] = React.useState([...initialSteps]);
  const [leaveSteps, setLeaveSteps] = React.useState([...initialLeavingSteps]);

  /**
   * Update the data in the steps according to the step number
   *
   * Notes:
   * - If complete, display a checkmark
   * - If not complete, display a number
   * - If active, display a number
   * - If not complete and there are instructions, display instructions
   * - If complete, display completeText
   */
  const handleNewStep = (newStep: number, data: any) => {
    console.log('new step', newStep, data);
    let modifiedSteps = [...initialSteps];

    if (newStep < 0 || newStep > 5) {
      console.error('Invalid step');
      return;
    }

    // Special case for step 0
    if (newStep === 0 && data[0] && modifiedSteps[0].instructions2) {
      modifiedSteps[0].instructions2.address = data[0];
    }

    for (let step = 0; step < modifiedSteps.length; step++) {
      if (step < newStep) {
        modifiedSteps[step].complete = true;

        // Special handling for step 1
        if (step === 1 && newStep > 1 && data[1]) {
          modifiedSteps[1].completeText.address = data[1];
        }
      } else {
        modifiedSteps[step].complete = false;
        // Reset completeText for steps after newStep, if needed
      }
    }

    setSteps(modifiedSteps);
    setActiveStep(newStep);
  };

  const handleLeavingStep = (leavingStep: number) => {
    console.log('new leaving step', leavingStep);
    let modifiedSteps = [...initialLeavingSteps];

    if (leavingStep < -1 || leavingStep > 1) {
      console.error('Invalid step');
      return;
    }

    for (let step = 0; step < modifiedSteps.length; step++) {
      if (step < leavingStep) {
        modifiedSteps[step].complete = true;
      } else {
        modifiedSteps[step].complete = false;
        // Reset completeText for steps after newStep, if needed
      }
    }

    setLeaveSteps(modifiedSteps);
    setActiveLeavingStep(leavingStep);
  };

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const { activeStep: activeLeavingStep, setActiveStep: setActiveLeavingStep } =
    useSteps({
      index: -1,
      count: leaveSteps.length,
    });

  const standardStepper = (step: any, index: number) => {
    return (
      <Step key={index}>
        <StepIndicator
          color="var(--chakra-colors-dark-purple-500)"
          borderColor="var(--chakra-colors-dark-purple-500)"
          fontWeight={'bold'}
        >
          <StepStatus
            complete={'🪦'}
            incomplete={<StepNumber />}
            active={<StepNumber />}
          />
        </StepIndicator>
        <Box flexShrink="0" textAlign={'left'}>
          <StepTitle
            style={{
              color: 'var(--chakra-colors-dark-purple-500)',
              fontWeight: 'bold',
              width: '435px',
            }}
          >
            {step.title}
          </StepTitle>
          {!step.complete ? (
            <Box>
              <Box>{step.instructions}</Box>
              {step.instructions2 && step.instructions2.address && (
                <Flex>
                  <Box mr="2px">{step.instructions2.text}</Box>
                  <a
                    href={`${networkConfig.explorerURL}/address/${step.instructions2.address}`}
                    style={{ textDecoration: 'underline' }}
                    target="_blank"
                  >
                    ({formatAddress(step.instructions2.address)})
                  </a>
                </Flex>
              )}
            </Box>
          ) : (
            <StepDescription as={'div'}>
              <Flex alignItems="center" gap={1}>
                {step.completeText.text}
                {step.completeText.address && (
                  <a
                    href={`${networkConfig.explorerURL}/address/${step.completeText.address}`}
                    style={{ textDecoration: 'underline' }}
                    target="_blank"
                  >
                    {formatAddress(step.completeText.address)}
                  </a>
                )}
                {step.complete ? <FaCheckCircle /> : <></>}
              </Flex>
            </StepDescription>
          )}
        </Box>
        <StepSeparator
          style={{
            color: 'var(--chakra-colors-dark-purple-500)',
            backgroundColor: 'var(--chakra-colors-dark-purple-500)',
          }}
        />
      </Step>
    );
  };

  const displayMainTitle = () => {
    if (activeLeavingStep > -1) {
      return 'STOP SENDING UNWANTED ASSETS TO GRAVE';
    } else {
      if (steps[2].complete) {
        return 'YOU HAVE A GRAVE SPAMBOX!';
      } else {
        return 'SET UP YOUR GRAVE SPAMBOX';
      }
    }
  };

  return (
    <Box display="flex">
      <VStack
        spacing={4}
        p={10}
        textAlign="center"
        width={'555px'}
        minHeight={'335px'}
      >
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
        >
          {displayMainTitle()}
        </Text>
        <JoinGraveBtn
          onJoiningStepChange={handleNewStep}
          onLeavingStepChange={handleLeavingStep}
        />

        {activeLeavingStep > -1 ? (
          <Stepper
            index={activeLeavingStep}
            orientation="vertical"
            gap="3"
            id="leaving-grave-step-indicator"
          >
            {leaveSteps.map((step, index) => standardStepper(step, index))}
          </Stepper>
        ) : (
          <Stepper
            index={activeStep}
            orientation="vertical"
            gap="3"
            id="grave-step-indicator"
          >
            {steps.map((step, index) => standardStepper(step, index))}
          </Stepper>
        )}
      </VStack>
      <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'} />
    </Box>
  );
};

export default JoinGravePanel;
