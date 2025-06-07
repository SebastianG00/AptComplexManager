import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, DollarSign, Home, User, Calendar, Camera, FileText, CheckCircle, AlertCircle, Edit3, Trash2, X, ChevronDown, ChevronRight, BarChart3, Download, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import apiService from '../services/apiService.js'; // Adjust the path '../' as needed
// --- MODIFIED SECTION: API Service Layer ---
// This now points to your live backend server.
const API_BASE_URL = 'http://localhost:3001/api';


const ApartmentManager = ({ token, onLogout }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditRent, setShowEditRent] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingRent, setEditingRent] = useState("");
  const [expandedMonths, setExpandedMonths] = useState({});
  const [showDashboard, setShowDashboard] = useState(false);

  const [newTenant, setNewTenant] = useState({
    name: "",
    apartment: "",
    unitType: "2-bed",
    monthlyRent: "",
    notes: ""
  });

  const [newPayment, setNewPayment] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "Cash",
    paidBy: "",
    photo: null
  });

 //Initial data load
  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Get data from the API. The 'id' is correct, but dates are full ISO strings.
      const data = await apiService.getTenants();

      // 2. Process the data: keep the correct 'id' from the server AND format dates.
      const processedTenants = data.map(tenant => ({
        ...tenant, // This copies all properties, including the correct 'id' that came from the server.

        // This part correctly formats the dates for rent history
        rentHistory: (tenant.rentHistory || []).map(entry => ({
          ...entry,
          // We no longer need to check if it's a string, new Date() handles it.
          date: new Date(entry.date).toISOString().split('T')[0]
        })),

        // This part correctly formats the dates for payments
        payments: (tenant.payments || []).map(payment => ({
          ...payment,
          date: new Date(payment.date).toISOString().split('T')[0]
        }))
        // We DO NOT add 'id: tenant._id' here because '...tenant' already includes the correct 'id'.
      }));
      
      // 3. Set the fully processed and correct data into state.
      setTenants(processedTenants);

    } catch (err) {
      setError('Failed to load tenants: ' + err.message);
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadTenants(); }, []);
  
  // --- THIS IS THE KEY FIX ---
  // A helper function to safely update the tenant list with data from the API
  const handleUpdateTenantState = (updatedTenant) => {
    setTenants(currentTenants => currentTenants.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    // Also update the 'selectedTenant' if it's the one being changed
    if (selectedTenant && selectedTenant.id === updatedTenant.id) {
      setSelectedTenant(updatedTenant);
    }
  };
  
  // --- All functions below now use the API response to update state ---
  const calculateTotalPaid = (payments) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculateBalance = (tenant) => {
    const totalPaid = calculateTotalPaid(tenant.payments);
    return tenant.monthlyRent - totalPaid;
  };

  const addTenant = async () => {
    if (newTenant.name && newTenant.apartment && newTenant.monthlyRent) {
      try {
        setLoading(true);
        const tenantData = { ...newTenant, monthlyRent: parseFloat(newTenant.monthlyRent) };
        const createdTenant = await apiService.createTenant(tenantData);
        const processedTenant = { ...createdTenant, id: createdTenant._id || createdTenant.id, payments: [], rentHistory: createdTenant.rentHistory };
        setTenants([...tenants, processedTenant]);
        setNewTenant({ name: "", apartment: "", unitType: "2-bed", monthlyRent: "", notes: "" });
        setShowAddTenant(false);
      } catch (err) {
        setError('Failed to add tenant: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteTenant = async (tenantId) => {
    try {
      setLoading(true);
      await apiService.deleteTenant(tenantId);
      setTenants(tenants.filter(tenant => tenant.id !== tenantId));
      setTenantToDelete(null);
      setShowDeleteConfirm(false);
      setSelectedTenant(null);
    } catch (err) {
      setError('Failed to delete tenant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantNotes = async () => {
    if (!selectedTenant) return;
    try {
      setLoading(true);
      const updatedTenant = await apiService.updateTenant(selectedTenant.id, { notes: editingNotes });
      handleUpdateTenantState(updatedTenant);
      setShowEditNotes(false);
    } catch (err) { setError('Failed to update notes: ' + err.message); } finally { setLoading(false); }
  };

  const updateTenantRent = async () => {
    if (!selectedTenant || !editingRent) return;
    try {
      setLoading(true);
      const updatedTenant = await apiService.updateTenant(selectedTenant.id, { monthlyRent: parseFloat(editingRent) });
      handleUpdateTenantState(updatedTenant);
      setShowEditRent(false);
    } catch (err) { setError('Failed to update rent: ' + err.message); } finally { setLoading(false); }
  };

  const addPayment = async () => {
    if (!selectedTenant || !newPayment.amount || !newPayment.paidBy) return;
    try {
      setLoading(true);
      const updatedTenant = await apiService.createPayment(selectedTenant.id, { ...newPayment, amount: parseFloat(newPayment.amount) });
      handleUpdateTenantState(updatedTenant);
      setNewPayment({ amount: "", date: new Date().toISOString().split('T')[0], method: "Cash", paidBy: "" });
      setShowAddPayment(false);
    } catch (err) { setError('Failed to add payment: ' + err.message); } finally { setLoading(false); }
  };

  const groupPaymentsByMonth = (payments) => {
    const grouped = {};
    payments.forEach(payment => {
      const date = new Date(payment.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = { monthName, payments: [], total: 0 };
      }
      grouped[monthYear].payments.push(payment);
      grouped[monthYear].total += payment.amount;
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([key, value]) => ({ key, ...value }));
  };

  const toggleMonth = (tenantId, monthKey) => {
    const key = `${tenantId}-${monthKey}`;
    setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ... (getDashboardData, exportToPDF, and other functions remain the same) ...
  const getDashboardData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthPayments = tenants.flatMap(tenant => 
      tenant.payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).map(payment => ({ ...payment, tenantName: tenant.name, tenantId: tenant.id }))
    );

    const totalMonthlyRent = tenants.reduce((sum, tenant) => sum + tenant.monthlyRent, 0);
    const totalCollected = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const collectionRate = totalMonthlyRent > 0 ? (totalCollected / totalMonthlyRent) * 100 : 0;

    const tenantsWithPendingPayments = tenants.filter(tenant => {
      const balance = calculateBalance(tenant);
      return balance > 0;
    }).map(tenant => ({
      ...tenant,
      balance: calculateBalance(tenant)
    }));

    const latePayments = currentMonthPayments.filter(payment => {
      // Create a date object, but add the timezone offset to prevent UTC conversion issues
      const dateString = payment.date + 'T00:00:00';
      const paymentDate = new Date(dateString);
      // Now getDate() will correctly return the local day of the month
      return paymentDate.getDate() > 5;
    });

    const paymentMethods = currentMonthPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {});

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthPayments = tenants.flatMap(tenant => 
        tenant.payments.filter(payment => {
          const paymentDate = new Date(payment.date);
          return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
        })
      );
      const monthTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: monthTotal
      });
    }

    return {
      totalMonthlyRent,
      totalCollected,
      collectionRate,
      tenantsWithPendingPayments,
      latePayments,
      paymentMethods,
      monthlyTrend,
      currentMonthPayments
    };
  };

  const exportToPDF = () => {
    const data = getDashboardData();
    const currentDate = new Date().toLocaleDateString();
    
    const content = `
      <html>
        <head>
          <title>Apartment Complex Report - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .pending { color: #dc2626; font-weight: bold; }
            .collected { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Apartment Complex Monthly Report</h1>
            <p>Generated on: ${currentDate}</p>
          </div>
          <div class="section">
            <h2>Monthly Summary</h2>
            <div class="stats">
              <div class="stat-item"><h3>Total Expected</h3><p class="collected">$${data.totalMonthlyRent}</p></div>
              <div class="stat-item"><h3>Total Collected</h3><p class="collected">$${data.totalCollected}</p></div>
              <div class="stat-item"><h3>Collection Rate</h3><p>${data.collectionRate.toFixed(1)}%</p></div>
            </div>
          </div>
          <div class="section">
            <h2>Tenants with Pending Payments</h2>
            <table>
              <thead><tr><th>Tenant Name</th><th>Apartment</th><th>Monthly Rent</th><th>Amount Owed</th></tr></thead>
              <tbody>
                ${data.tenantsWithPendingPayments.map(tenant => `<tr><td>${tenant.name}</td><td>${tenant.apartment}</td><td>$${tenant.monthlyRent}</td><td class="pending">$${tenant.balance}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Late Payments This Month</h2>
            <table>
              <thead><tr><th>Tenant</th><th>Amount</th><th>Payment Date</th><th>Method</th></tr></thead>
              <tbody>
                ${data.latePayments.map(payment => `<tr><td>${payment.tenantName}</td><td>$${payment.amount}</td><td>${new Date(payment.date).toLocaleDateString()}</td><td>${payment.method}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.apartment.includes(searchTerm);
    
    if (filter === "paid") return matchesSearch && calculateBalance(tenant) <= 0;
    if (filter === "owes") return matchesSearch && calculateBalance(tenant) > 0;
    return matchesSearch;
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPayment({ ...newPayment, photo: file });
    }
  };

  // Show loading state
  if (loading && tenants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading apartment data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-semibold text-red-800">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadTenants();
            }}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg flex justify-between items-center">
        {/* Left Side: Title and Subtitle */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Home className="w-8 h-8" />
            Apartment Complex Manager
          </h1>
          <p className="text-blue-100 mt-2">Hecho para mama de Sebas</p>
        </div>

        {loading && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-blue-100">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-100"></div>
              <span className="text-sm">Syncing data...</span>
            </div>
          </div>
        )}

        {/* Right Side: Logout Button */}
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Logout
        </button>

      </div>
      
      {/* Main Content */}

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or apartment..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Tenants</option>
                <option value="paid">Paid This Month</option>
                <option value="owes">Owes Money</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowAddTenant(true)}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Tenant
            </button>
            
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Dashboard Modal */}
        {showDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    Dashboard & Reports
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={exportToPDF}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => setShowDashboard(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Close
                    </button>
                  </div>
                </div>

                {(() => {
                  const data = getDashboardData();
                  return (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <Home className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Total Units</p>
                              <p className="text-2xl font-bold text-blue-800">{tenants.length}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm text-green-600 font-medium">This Month Collected</p>
                              <p className="text-2xl font-bold text-green-800">${data.totalCollected}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-yellow-600" />
                            <div>
                              <p className="text-sm text-yellow-600 font-medium">Collection Rate</p>
                              <p className="text-2xl font-bold text-yellow-800">{data.collectionRate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                            <div>
                              <p className="text-sm text-red-600 font-medium">Pending Payments</p>
                              <p className="text-2xl font-bold text-red-800">{data.tenantsWithPendingPayments.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Charts Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Trend Chart */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            6-Month Collection Trend
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data.monthlyTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value}`, 'Collected']} />
                              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Payment Methods Pie Chart */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" />
                            Payment Methods This Month
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={Object.entries(data.paymentMethods).map(([method, amount]) => ({ method, amount }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                                label={({ method, amount }) => `${method}: ${amount}`}
                              >
                                {Object.entries(data.paymentMethods).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value}`, 'Amount']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pending Payments Table */}
                      <div className="bg-white rounded-lg border">
                        <div className="p-4 border-b">
                          <h3 className="font-semibold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Tenants with Pending Payments ({data.tenantsWithPendingPayments.length})
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tenant</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Apartment</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Monthly Rent</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount Owed</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {data.tenantsWithPendingPayments.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{tenant.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{tenant.apartment}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">${tenant.monthlyRent}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-red-600">${tenant.balance}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{tenant.notes || 'No notes'}</td>
                                </tr>
                              ))}
                              {data.tenantsWithPendingPayments.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    🎉 All tenants are up to date with payments!
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Late Payments This Month */}
                      <div className="bg-white rounded-lg border">
                        <div className="p-4 border-b">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            Late Payments This Month ({data.latePayments.length})
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">Payments made after the 5th of the month</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tenant</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Late</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {data.latePayments.map(payment => {
                                const daysLate = new Date(payment.date).getDate() - 5;
                                return (
                                  <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.tenantName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">${payment.amount}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.method}</td>
                                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">{daysLate} days</td>
                                  </tr>
                                );
                              })}
                              {data.latePayments.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    ✅ No late payments this month!
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTenants.map(tenant => {
            const balance = calculateBalance(tenant);
            const totalPaid = calculateTotalPaid(tenant.payments);
            
            return (
              <div key={tenant.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{tenant.name}</h3>
                        <p className="text-gray-600">Apt {tenant.apartment} • {tenant.unitType}</p>
                      </div>
                    </div>
                    {balance <= 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${tenant.monthlyRent}</span>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setEditingRent(tenant.monthlyRent.toString());
                            setShowEditRent(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Edit rent amount"
                        >
                          <Edit3 className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="font-semibold text-green-600">${totalPaid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance:</span>
                      <span className={`font-semibold ${balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(balance)} {balance < 0 ? 'overpaid' : balance > 0 ? 'owed' : ''}
                      </span>
                    </div>
                  </div>

                  {tenant.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg relative group">
                      <p className="text-sm text-gray-700 pr-8">{tenant.notes}</p>
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setEditingNotes(tenant.notes);
                          setShowEditNotes(true);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title="Edit notes"
                      >
                        <Edit3 className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {tenant.payments.length} payment{tenant.payments.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setNewPayment({ ...newPayment, paidBy: tenant.name });
                            setShowAddPayment(true);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                        >
                          <DollarSign className="w-4 h-4" />
                          Add Payment
                        </button>
                        <button
                          onClick={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          {selectedTenant?.id === tenant.id ? 'Hide' : 'View'} Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setEditingNotes(tenant.notes || "");
                            setShowEditNotes(true);
                          }}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 flex items-center gap-1"
                          title="Edit notes"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setTenantToDelete(tenant);
                            setShowDeleteConfirm(true);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                          title="Delete tenant"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* --- MODIFIED & NEW SECTION: Combined Details View --- */}
                {selectedTenant?.id === tenant.id && (
                  <div className="bg-gray-50/70 border-t border-gray-200">
                    {/* Rent History */}
                    {tenant.rentHistory && tenant.rentHistory.length > 0 && (
                      <div className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          Rent History
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {tenant.rentHistory
                            .slice() // Create a shallow copy to avoid mutating original data
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((entry, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium text-blue-800">${entry.amount}/month</div>
                                  <div className="text-sm text-gray-600">
                                    Effective {new Date(entry.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    )}

                {/* Payment History */}
                    {tenant.payments.length > 0 && (
                      <div className="border-t border-gray-200 p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          Payment History
                        </h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {groupPaymentsByMonth(tenant.payments).map(({ key, monthName, payments, total }) => {
                            const isExpanded = expandedMonths[`${tenant.id}-${key}`];
                            return (
                              <div key={key} className="bg-white rounded-lg border">
                                <button onClick={() => toggleMonth(tenant.id, key)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                    <span className="font-medium">{monthName}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                                    <span className="font-semibold text-green-600">${total}</span>
                                  </div>
                                </button>
                                
                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                    <div className="space-y-2">
                                      {payments.map(payment => (
                                        <div key={payment.id} className="bg-gray-50 p-3 rounded border">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="font-medium">${payment.amount}</div>
                                              <div className="text-sm text-gray-600">{payment.method} • {new Date(payment.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} • by {payment.paidBy}</div>
                                            </div>
                                            {payment.photo && (<Camera className="w-4 h-4 text-blue-600" />)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Tenant Modal */}
        {showAddTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add New Tenant</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Apartment Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTenant.apartment}
                  onChange={(e) => setNewTenant({ ...newTenant, apartment: e.target.value })}
                />
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTenant.unitType}
                  onChange={(e) => setNewTenant({ ...newTenant, unitType: e.target.value })}
                >
                  <option value="1-bed">1 Bedroom</option>
                  <option value="2-bed">2 Bedroom</option>
                  <option value="3-bed">3 Bedroom</option>
                  <option value="studio">Studio</option>
                </select>
                <input
                  type="number"
                  placeholder="Monthly Rent"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTenant.monthlyRent}
                  onChange={(e) => setNewTenant({ ...newTenant, monthlyRent: e.target.value })}
                />
                <textarea
                  placeholder="Notes (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={newTenant.notes}
                  onChange={(e) => setNewTenant({ ...newTenant, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTenant}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Tenant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rent Modal */}
        {showEditRent && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Rent for {selectedTenant.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Rent: ${selectedTenant.monthlyRent}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter new rent amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingRent}
                    onChange={(e) => setEditingRent(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Common reasons for rent changes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Construction/noise disruption - temporary reduction</li>
                    <li>Maintenance issues - temporary reduction</li>
                    <li>Annual rent increase</li>
                    <li>Unit improvements - rent increase</li>
                    <li>Market adjustment</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditRent(false);
                    setEditingRent("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTenantRent}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Rent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Notes Modal */}
        {showEditNotes && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Notes for {selectedTenant.name}</h3>
              <div className="space-y-4">
                <textarea
                  placeholder="Enter notes (e.g., 'Promise to pay next week', 'Overpaid $200 for next month', etc.)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                />
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Common examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Promise to pay next week</li>
                    <li>Overpaid $200 - credit for next month</li>
                    <li>Always pays late but reliable</li>
                    <li>Partial payment - owes $300 more</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditNotes(false);
                    setEditingNotes("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTenantNotes}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && tenantToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Delete Tenant</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete <strong>{tenantToDelete.name}</strong> from apartment <strong>{tenantToDelete.apartment}</strong>?
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    <li>All payment records ({tenantToDelete.payments?.length || 0} payments)</li>
                    <li>All notes and observations</li>
                    <li>Tenant information</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTenantToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTenant(tenantToDelete.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Tenant
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddPayment && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add Payment for {selectedTenant.name}</h3>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Payment Amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                />
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Money Order">Money Order</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <input
                  type="text"
                  placeholder="Paid by (name)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newPayment.paidBy}
                  onChange={(e) => setNewPayment({ ...newPayment, paidBy: e.target.value })}
                />
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="flex-1 text-sm text-gray-600"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPayment}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentManager;