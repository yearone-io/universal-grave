import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  useSteps,
  useToast,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { formatAddress } from '@/utils/tokenUtils';
import { FaCheckCircle } from 'react-icons/fa';
import {
  toggleForwarderAsLSPDelegate,
  updateBECPermissions,
} from '@/utils/urdUtils';
import { migrateVaultToNewForwarder } from '@/utils/vaultUtils';

const initialLeavingSteps = [
  {
    title: 'Give your 🆙 necessary permissions',
    instructions: 'Give permissions to your Browser Extension Controller.',
    instructions2: { text: 'This can also be done manually.', address: null },
    completeText: { text: 'PERMISSION SET', address: null },
    complete: false,
  },
  {
    title: 'Reset previous LSP7 and LSP8 delegate permissions',
    completeText: { text: '', address: null },
    complete: false,
  },
  {
    title: 'Migrate your GRAVE to the new forwarder',
    completeText: { text: '', address: null },
    complete: false,
  },
  {
    title: 'Direct all 🆙 spam to the GRAVE',
    completeText: { text: 'SPAM IS DEAD', address: null },
    complete: false,
  },
];

export const UpgradeURD = ({
  oldForwarderAddress,
}: {
  oldForwarderAddress: string;
}) => {
  const walletContext = useContext(WalletContext);
  const {
    account,
    provider,
    networkConfig,
    setURDLsp7,
    setURDLsp8,
    mainUPController,
    disconnectIfNetworkChanged,
  } = walletContext;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [leaveSteps, setLeaveSteps] = React.useState([...initialLeavingSteps]);
  const [leavingStep, setLeavingStep] = useState<number>(-1);

  const { activeStep: activeLeavingStep, setActiveStep: setActiveLeavingStep } =
    useSteps({
      index: -1,
      count: leaveSteps.length,
    });

  const toast = useToast();

  const handleUpgrade = async () => {
    if (await disconnectIfNetworkChanged()) {
      return;
    }
    setIsSubmitting(true);
    setLeavingStep(0);

    try {
      await updateBECPermissions(provider, account!, mainUPController!);
    } catch (e: any) {
      console.error('Error updating permissions', e);
      toast({
        title: `Error updating permissions: ${e.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(0);
      setIsSubmitting(false);
      return;
    }

    setLeavingStep(1);

    try {
      await toggleForwarderAsLSPDelegate(
        provider,
        account!,
        oldForwarderAddress,
        false
      );
    } catch (e: any) {
      console.error('Error resetting LSP delegates', e);
      toast({
        title: `Error resetting LSP delegates: ${e.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(0);
      setIsSubmitting(false);
      return;
    }

    setLeavingStep(2);

    try {
      await migrateVaultToNewForwarder(
        provider,
        oldForwarderAddress,
        networkConfig.universalGraveForwarder
      );
    } catch (e: any) {
      console.error(
        'Error migrating your GRAVE to the new forwarder',
        e.message
      );
      toast({
        title: `Error redirecting spam to grave ${e.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(0);
      setIsSubmitting(false);
      return;
    }

    setLeavingStep(3);

    try {
      await toggleForwarderAsLSPDelegate(
        provider,
        account!,
        networkConfig.universalGraveForwarder,
        true
      );
      setURDLsp7(networkConfig.universalGraveForwarder);
      setURDLsp8(networkConfig.universalGraveForwarder);
    } catch (e: any) {
      console.error('Error setting forwarder as LSP delegate', e);
      toast({
        title: `Error setting forwarder as LSP delegate ${e.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(0);
      setIsSubmitting(false);
    }

    setLeavingStep(4);
    setIsSubmitting(false);
  };

  const handleLeavingStep = (leavingStep: number) => {
    console.log('new leaving step', leavingStep);
    let modifiedSteps = [...initialLeavingSteps];

    if (leavingStep < -1 || leavingStep > initialLeavingSteps.length) {
      console.error('Invalid step');
      return;
    }

    for (let step = 0; step < modifiedSteps.length; step++) {
      console.log(`step: ${step}, leavingStep: ${leavingStep}`);
      if (step < leavingStep) {
        modifiedSteps[step].complete = true;
      } else {
        modifiedSteps[step].complete = false;
      }
    }

    setLeaveSteps(modifiedSteps);
    setActiveLeavingStep(leavingStep);
  };

  useEffect(() => {
    handleLeavingStep(leavingStep);
  }, [leavingStep]);

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

  return (
    <>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        There is a new version of the Universal Grave available - please upgrade
        to continue.
      </Text>
      <Button
        isLoading={isSubmitting}
        loadingText={'Upgrading..'}
        onClick={handleUpgrade}
      >
        Upgrade
      </Button>

      <Stepper
        index={activeLeavingStep}
        orientation="vertical"
        gap="3"
        id="leaving-grave-step-indicator"
      >
        {leaveSteps.map((step, index) => standardStepper(step, index))}
      </Stepper>
    </>
  );
};
