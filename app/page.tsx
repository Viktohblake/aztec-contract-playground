"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  Shield,
  Zap,
  Vote,
  Heart,
  Plus,
  Minus,
  Wallet,
  Users,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

type ContractType = "counter" | "voting" | "donation"
type Mode = "public" | "private"

interface ContractStates {
  counter: {
    value: number
    nullifiers: string[]
    adminAddress: string
  }
  voting: {
    alice: number
    bob: number
    userVote: string | null
    hasVoted: boolean
    nullifiers: string[]
    totalVotes: number
  }
  donation: {
    total: number
    userDonation: number
    operatorAddress: string
    withdrawnAmount: number
    donations: Array<{ amount: number; timestamp: string }>
  }
}

export default function AztecPlayground() {
  const [contractType, setContractType] = useState<ContractType>("counter")
  const [mode, setMode] = useState<Mode>("public")
  const [donationAmount, setDonationAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState("0x1234...5678")
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const [states, setStates] = useState<ContractStates>({
    counter: {
      value: 12,
      nullifiers: [],
      adminAddress: "0xadmin...1234",
    },
    voting: {
      alice: 5,
      bob: 3,
      userVote: null,
      hasVoted: false,
      nullifiers: [],
      totalVotes: 8,
    },
    donation: {
      total: 15.5,
      userDonation: 0,
      operatorAddress: "0xadmin...5678",
      withdrawnAmount: 0,
      donations: [
        { amount: 2.5, timestamp: "2024-01-15 10:30" },
        { amount: 5.0, timestamp: "2024-01-15 14:20" },
        { amount: 8.0, timestamp: "2024-01-15 16:45" },
      ],
    },
  })

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const generateNullifier = (action: string, user: string) => {
    return `null_${action}_${user}_${Date.now()}`
  }

  const changeCounter = (amount: number) => {
    const nullifier = generateNullifier("counter", userAddress)

    if (mode === "private" && states.counter.nullifiers.includes(nullifier)) {
      showNotification("error", "Double-spending detected! Nullifier already exists.")
      return
    }

    setStates((prev) => ({
      ...prev,
      counter: {
        ...prev.counter,
        value: prev.counter.value + amount,
        nullifiers: mode === "private" ? [...prev.counter.nullifiers, nullifier] : prev.counter.nullifiers,
      },
    }))

    showNotification("success", `Counter ${amount > 0 ? "incremented" : "decremented"} successfully!`)
  }

  const castVote = (candidate: "alice" | "bob") => {
    if (states.voting.hasVoted) {
      showNotification("error", "You have already voted! Each account can only vote once.")
      return
    }

    const nullifier = generateNullifier("vote", userAddress)

    setStates((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        [candidate]: prev.voting[candidate] + 1,
        userVote: candidate,
        hasVoted: true,
        nullifiers: [...prev.voting.nullifiers, nullifier],
        totalVotes: prev.voting.totalVotes + 1,
      },
    }))

    showNotification("success", `Vote cast for ${candidate.charAt(0).toUpperCase() + candidate.slice(1)}!`)
  }

  const donate = () => {
    const amount = Number.parseFloat(donationAmount)
    if (!amount || amount <= 0) {
      showNotification("error", "Please enter a valid donation amount.")
      return
    }

    const newDonation = {
      amount,
      timestamp: new Date().toLocaleString(),
    }

    setStates((prev) => ({
      ...prev,
      donation: {
        ...prev.donation,
        total: prev.donation.total + amount,
        userDonation: prev.donation.userDonation + amount,
        donations: [...prev.donation.donations, newDonation],
      },
    }))

    setDonationAmount("")
    showNotification("success", `Donated ${amount} ETH successfully!`)
  }

  const withdrawToOperator = () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (!amount || amount <= 0 || amount > states.donation.total) {
      showNotification("error", "Invalid withdrawal amount.")
      return
    }

    setStates((prev) => ({
      ...prev,
      donation: {
        ...prev.donation,
        total: prev.donation.total - amount,
        withdrawnAmount: prev.donation.withdrawnAmount + amount,
      },
    }))

    setWithdrawAmount("")
    showNotification("success", `${amount} ETH withdrawn to operator successfully!`)
  }

  const getCounterByAdmin = () => {
    showNotification("info", `Admin view: Current counter value is ${states.counter.value}`)
  }

  const resetVoting = () => {
    setStates((prev) => ({
      ...prev,
      voting: {
        alice: 0,
        bob: 0,
        userVote: null,
        hasVoted: false,
        nullifiers: [],
        totalVotes: 0,
      },
    }))
    showNotification("info", "Voting contract reset by admin.")
  }

  const contractIcons = {
    counter: <Zap className="w-5 h-5" />,
    voting: <Vote className="w-5 h-5" />,
    donation: <Heart className="w-5 h-5" />,
  }

  const contractDescriptions = {
    counter: "A simple counter with nullifier-based double-spending protection",
    voting: "Anonymous voting with one-vote-per-account enforcement using nullifiers",
    donation: "Donation pool with verifiable withdrawals to operators",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-3">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row items-center justify-center">
            <img 
    src="/logo.svg" 
    alt="Aztec Logo" 
    className="w-50 h-10 object-contain mb-1"
  /> 
  Contract Playground
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the magic of Aztec smart contracts. Experience the difference between public and private execution
            modes.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <Alert
            className={`mb-6 ${
              notification.type === "success"
                ? "border-green-500 bg-green-50"
                : notification.type === "error"
                  ? "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Contract Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Contract Type</label>
                <Select value={contractType} onValueChange={(value: ContractType) => setContractType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="counter">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Counter Contract
                      </div>
                    </SelectItem>
                    <SelectItem value="voting">
                      <div className="flex items-center gap-2">
                        <Vote className="w-4 h-4" />
                        Voting Contract
                      </div>
                    </SelectItem>
                    <SelectItem value="donation">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Donation Contract
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Execution Mode</label>
                <Select value={mode} onValueChange={(value: Mode) => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Public Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Private Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
                  {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {isConnected ? "Connected" : "Simulated"}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {userAddress}
                </Badge>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                {contractIcons[contractType]}
                {contractDescriptions[contractType]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interaction Area */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {contractIcons[contractType]}
                Contract Interactions
              </CardTitle>
              <CardDescription>Interact with the {contractType} contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractType === "counter" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button onClick={() => changeCounter(1)} className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      Increment
                    </Button>
                    <Button onClick={() => changeCounter(-1)} variant="outline" className="flex-1">
                      <Minus className="w-4 h-4 mr-2" />
                      Decrement
                    </Button>
                  </div>
                  <Button onClick={getCounterByAdmin} variant="secondary" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Admin: Get Counter
                  </Button>
                </div>
              )}

              {contractType === "voting" && (
                <div className="space-y-3">
                  <Button onClick={() => castVote("alice")} disabled={states.voting.hasVoted} className="w-full">
                    <Vote className="w-4 h-4 mr-2" />
                    Vote for Alice
                  </Button>
                  <Button
                    onClick={() => castVote("bob")}
                    disabled={states.voting.hasVoted}
                    variant="outline"
                    className="w-full"
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    Vote for Bob
                  </Button>
                  <Button onClick={resetVoting} variant="secondary" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Admin: Reset Voting
                  </Button>
                </div>
              )}

              {contractType === "donation" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount in ETH"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={donate}>
                      <Heart className="w-4 h-4 mr-2" />
                      Donate
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Operator Withdrawal</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Withdraw amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={withdrawToOperator} variant="outline">
                        <Wallet className="w-4 h-4 mr-2" />
                        Withdraw
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Operator: {states.donation.operatorAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* State View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mode === "private" ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                Contract State View
                <Badge variant={mode === "private" ? "secondary" : "default"}>
                  {mode === "private" ? "Private" : "Public"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="state" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="state">Current State</TabsTrigger>
                  <TabsTrigger value="settlement">Settlement</TabsTrigger>
                  <TabsTrigger value="technical">Technical Details</TabsTrigger>
                </TabsList>

                <TabsContent value="state" className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border-2 ${mode === "private" ? "border-purple-200 bg-purple-50" : "border-green-200 bg-green-50"}`}
                  >
                    {contractType === "counter" && (
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-2 ${mode === "private" ? "blur-sm" : ""}`}>
                          Counter: {states.counter.value}
                        </div>
                        {mode === "private" && (
                          <p className="text-sm text-purple-600">
                            Your counter value is private. Others can&apost see the exact value.
                          </p>
                        )}
                      </div>
                    )}

                    {contractType === "voting" && (
                      <div>
                        {mode === "public" ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Alice:</span>
                              <Badge variant="default">{states.voting.alice} votes</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Bob:</span>
                              <Badge variant="outline">{states.voting.bob} votes</Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">Total votes: {states.voting.totalVotes}</div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="blur-sm mb-2">
                              <div>Alice: ??? votes</div>
                              <div>Bob: ??? votes</div>
                            </div>
                            <p className="text-sm text-purple-600">
                              {states.voting.userVote
                                ? `You voted for ${states.voting.userVote.charAt(0).toUpperCase() + states.voting.userVote.slice(1)}`
                                : "You haven't voted yet"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Vote counts are private. Only your vote is visible to you.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {contractType === "donation" && (
                      <div>
                        {mode === "public" ? (
                          <div className="space-y-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{states.donation.total} ETH</div>
                              <p className="text-sm text-gray-600">Total Donations</p>
                            </div>
                            <div className="flex justify-between gap-4 text-sm">
                              <div>
                                <span className="font-medium">Your donations:</span>
                                <div className="text-lg">{states.donation.userDonation} ETH</div>
                              </div>
                              <div>
                                <span className="font-medium">Withdrawn:</span>
                                <div className="text-lg text-red-600">{states.donation.withdrawnAmount} ETH</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="blur-sm mb-2">
                              <div className="text-2xl font-bold">??? ETH</div>
                              <p className="text-sm">Total Donations</p>
                            </div>
                            <p className="text-sm text-purple-600">You donated: {states.donation.userDonation} ETH</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total donation amount is private. Only your contribution is visible.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settlement" className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    {mode === "public" ? (
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">📜 Public Settlement</h4>
                        <p className="text-sm text-blue-700">
                          All state changes are recorded directly on Ethereum. Anyone can verify the current state and
                          transaction history.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-2">🔒 Private Settlement</h4>
                        <p className="text-sm text-purple-700">
                          State changes are verified using zk-SNARKs off-chain. Only cryptographic proofs are submitted
                          to Ethereum, preserving privacy.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="space-y-3 text-sm">
                    {contractType === "counter" && (
                      <div>
                        <h4 className="font-semibold">Nullifier Protection</h4>
                        <p className="text-gray-600 mb-2">
                          Prevents double-spending by generating unique nullifiers for each transaction.
                        </p>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          Active nullifiers: {states.counter.nullifiers.length}
                        </div>
                      </div>
                    )}

                    {contractType === "voting" && (
                      <div>
                        <h4 className="font-semibold">One Vote Per Account</h4>
                        <p className="text-gray-600 mb-2">
                          Uses nullifiers to ensure each Aztec account can only vote once.
                        </p>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <div>Voting nullifiers: {states.voting.nullifiers.length}</div>
                          <div>Your voting status: {states.voting.hasVoted ? "Voted" : "Not voted"}</div>
                        </div>
                      </div>
                    )}

                    {contractType === "donation" && (
                      <div>
                        <h4 className="font-semibold">Verifiable Withdrawals</h4>
                        <p className="text-gray-600 mb-2">
                          Operator can withdraw funds with cryptographic proof of authorization.
                        </p>
                        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                          <div>Operator: {states.donation.operatorAddress}</div>
                          <div>Total withdrawn: {states.donation.withdrawnAmount} ETH</div>
                          <div>Available: {states.donation.total} ETH</div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
         
        </div>
        <p className="text-center font-bold text-lg text-gray-600 max-w-2xl mx-auto mt-5">
        built with luv <a href="https://x.com/viktohblake" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@viktohblake</a>
        </p>
      </div>
     
    </div>
  )
}
