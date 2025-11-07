'use client';
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useEffect } from "react";
import { type BaseError, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Alert, AlertDescription } from "../ui/alert";

import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/utils/constants";

const SimpleStorage = () => {

    const [inputNumber, setInputNumber] = useState('');
    const [validationError, setValidationError] = useState('');

    const { data: hash, error: writeError, writeContract, isPending: writeIsPending } = useWriteContract()

    const { data: number, error: readError, isPending: readIsPending, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMyNumber',
    })

    // Validate and send the transaction
    const handleSetNumber = async() => {
        // Reset previous validation error
        setValidationError('');

        // Validation 1: Check if input is empty
        if (!inputNumber || inputNumber.trim() === '') {
            setValidationError('Please enter a number');
            return;
        }

        // Validation 2: Check if input is a valid number
        if (isNaN(Number(inputNumber))) {
            setValidationError('Please enter a valid number');
            return;
        }

        // Validation 3: Check if number is negative (smart contracts use uint256 - unsigned integers only)
        if (Number(inputNumber) < 0) {
            setValidationError('Please enter a positive number (negative numbers are not allowed)');
            return;
        }

        // Validation 4: Check if number has decimals (smart contracts only accept whole numbers)
        if (inputNumber.includes('.') || inputNumber.includes(',')) {
            setValidationError('Please enter a whole number (no decimals allowed)');
            return;
        }

        // If all validations pass, send the transaction
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'setMyNumber',
            args: [BigInt(inputNumber)],
        })
    }

    // Wait for transaction confirmation
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    // Refresh the displayed number after transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            refetch();
            setInputNumber(''); // Clear input after successful transaction
        }
    }, [isConfirmed, refetch])

    // Show loading state while fetching data from blockchain
    if (readIsPending) return <div className="p-6 text-center">Loading your stored number...</div>

    // Show error if unable to read from contract
    if (readError)
    return (
      <div className="p-6">
        <Alert variant="destructive">
            <AlertDescription>
                Unable to read from smart contract. Make sure you are connected to the correct network (Hardhat local network).
            </AlertDescription>
        </Alert>
      </div>
    )

    return (
        <>
            {/* Display the current number stored on the blockchain */}
            <div className="p-6 border border-border rounded-lg bg-card">
                <div className="text-lg">
                    Your stored number: <span className="font-bold text-primary">{number?.toString()}</span>
                </div>
            </div>

            {/* Form to update the number */}
            <div className="p-6 border border-border rounded-lg bg-card mt-5">

                {/* Show transaction hash when transaction is sent */}
                {hash && (
                    <Alert className="mb-4">
                        <AlertDescription>
                            <div className="font-semibold mb-1">Transaction sent!</div>
                            <div className="text-xs break-all">Hash: {hash}</div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Show waiting message while transaction is being confirmed */}
                {isConfirming && (
                    <Alert className="mb-4">
                        <AlertDescription>
                            Waiting for blockchain confirmation... This may take a few seconds.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Show success message when transaction is confirmed */}
                {isConfirmed && (
                    <Alert className="mb-4 border-green-600 bg-green-500/10">
                        <AlertDescription className="text-foreground">
                            ✅ Transaction confirmed! Your number has been updated on the blockchain.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Show validation error if input is invalid */}
                {validationError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            {validationError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Show blockchain error if transaction fails */}
                {writeError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            <div className="font-semibold mb-1">Transaction failed</div>
                            <div className="text-sm">{(writeError as BaseError).shortMessage || writeError.message}</div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number-input" className="text-base font-semibold">
                            Update your number
                        </Label>
                        <Input
                            id="number-input"
                            type="number"
                            placeholder="Enter a whole number (e.g., 42)..."
                            value={inputNumber}
                            onChange={(e) => setInputNumber(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleSetNumber}
                        className="w-full"
                        disabled={writeIsPending || isConfirming}
                    >
                        {writeIsPending || isConfirming ? 'Processing...' : 'Submit to Blockchain'}
                    </Button>
                </div>
            </div>
        </>
    )
}

export default SimpleStorage