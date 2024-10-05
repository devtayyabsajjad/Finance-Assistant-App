"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon, DollarSign, TrendingUpIcon, TrendingDownIcon, PlusIcon, Edit2Icon, TrashIcon } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

type Transaction = {
  id: string
  name: string
  description: string
  amount: number
  category: string
  date: string
  time: string
  type: 'income' | 'expense'
  currency: Currency
}

type Currency = 'USD' | 'EUR' | 'PKR'

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  PKR: '₨'
}

const currencyRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.85,
  PKR: 280
}

export function DashboardComponent() {
  const [scrollY, setScrollY] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    name: '',
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    type: 'expense',
    currency: 'USD'
  })
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const storedTransactions = localStorage.getItem('transactions')
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
    calculateTotals()
  }, [transactions])

  const calculateTotals = () => {
    const income = transactions.reduce((sum, t) => sum + (t.type === 'income' ? convertCurrency(t.amount, t.currency, 'USD') : 0), 0)
    const expenses = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? convertCurrency(t.amount, t.currency, 'USD') : 0), 0)
    setTotalIncome(income)
    setTotalExpenses(expenses)
  }

  const addTransaction = () => {
    if (!newTransaction.name || newTransaction.amount === 0 || !newTransaction.category) {
      alert('Please fill in all required fields')
      return
    }
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString(),
      amount: Number(newTransaction.amount)
    }
    setTransactions([...transactions, transaction])
    setNewTransaction({
      name: '',
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      type: 'expense',
      currency: 'USD'
    })
    alert('Transaction added successfully')
  }

  const updateTransaction = () => {
    if (!editingTransaction) return
    const updatedTransactions = transactions.map(t =>
      t.id === editingTransaction.id ? editingTransaction : t
    )
    setTransactions(updatedTransactions)
    setEditingTransaction(null)
    setIsEditDialogOpen(false)
    alert('Transaction updated successfully')
  }

  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id)
    setTransactions(updatedTransactions)
    alert('Transaction deleted successfully')
  }

  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency) => {
    const inUSD = amount / currencyRates[fromCurrency]
    return inUSD * currencyRates[toCurrency]
  }

  const generateReport = () => {
    const report = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expenses: 0 }
      }
      const convertedAmount = convertCurrency(t.amount, t.currency, displayCurrency)
      if (t.type === 'income') {
        acc[t.category].income += convertedAmount
      } else {
        acc[t.category].expenses += convertedAmount
      }
      return acc
    }, {} as Record<string, { income: number, expenses: number }>)

    return Object.entries(report).map(([category, { income, expenses }]) => ({
      category,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      balance: (income - expenses).toFixed(2)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Finances</h1>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newTransaction.name}
                      onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: 'income' | 'expense') => setNewTransaction({ ...newTransaction, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                      Currency
                    </Label>
                    <Select
                      value={newTransaction.currency}
                      onValueChange={(value: Currency) => setNewTransaction({ ...newTransaction, currency: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTransaction.time}
                      onChange={(e) => setNewTransaction({ ...newTransaction, time: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addTransaction}>Add Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Report</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Financial Report</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateReport().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{currencySymbols[displayCurrency]}{item.income}</TableCell>
                        <TableCell>{currencySymbols[displayCurrency]}{item.expenses}</TableCell>
                        <TableCell>{currencySymbols[displayCurrency]}{item.balance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>
            <Select value={displayCurrency} onValueChange={(value: Currency) => setDisplayCurrency(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="PKR">PKR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            <motion.div
              key="balance"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-100" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencySymbols[displayCurrency]}{convertCurrency(totalIncome - totalExpenses, 'USD', displayCurrency).toFixed(2)}</div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            <motion.div
              key="income"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Income</CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencySymbols[displayCurrency]}{convertCurrency(totalIncome, 'USD', displayCurrency).toFixed(2)}</div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            <motion.div
              key="expenses"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencySymbols[displayCurrency]}{convertCurrency(totalExpenses, 'USD', displayCurrency).toFixed(2)}</div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactions.map(t => ({ 
                  date: `${t.date} ${t.time}`, 
                  amount: convertCurrency(t.amount, t.currency, displayCurrency), 
                  type: t.type 
                }))}>
                  <XAxis dataKey="date" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollY > 100 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.name}</TableCell>
                      <TableCell>{currencySymbols[transaction.currency]}{transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.time}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => setEditingTransaction(transaction)}>
                                <Edit2Icon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Transaction</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-name" className="text-right">
                                    Name
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={editingTransaction?.name || ''}
                                    onChange={(e) => setEditingTransaction(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-amount" className="text-right">
                                    Amount
                                  </Label>
                                  <Input
                                    id="edit-amount"
                                    type="number"
                                    value={editingTransaction?.amount || 0}
                                    onChange={(e) => setEditingTransaction(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-category" className="text-right">
                                    Category
                                  </Label>
                                  <Input
                                    id="edit-category"
                                    value={editingTransaction?.category || ''}
                                    onChange={(e) => setEditingTransaction(prev => prev ? { ...prev, category: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-type" className="text-right">
                                    Type
                                  </Label>
                                  <Select
                                    value={editingTransaction?.type}
                                    onValueChange={(value: 'income' | 'expense') => setEditingTransaction(prev => prev ? { ...prev, type: value } : null)}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="income">Income</SelectItem>
                                      <SelectItem value="expense">Expense</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-currency" className="text-right">
                                    Currency
                                  </Label>
                                  <Select
                                    value={editingTransaction?.currency}
                                    onValueChange={(value: Currency) => setEditingTransaction(prev => prev ? { ...prev, currency: value } : null)}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="PKR">PKR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-date" className="text-right">
                                    Date
                                  </Label>
                                  <Input
                                    id="edit-date"
                                    type="date"
                                    value={editingTransaction?.date || ''}
                                    onChange={(e) => setEditingTransaction(prev => prev ? { ...prev, date: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-time" className="text-right">
                                    Time
                                  </Label>
                                  <Input
                                    id="edit-time"
                                    type="time"
                                    value={editingTransaction?.time || ''}
                                    onChange={(e) => setEditingTransaction(prev => prev ? { ...prev, time: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={updateTransaction}>Save Changes</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the transaction.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTransaction(transaction.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}