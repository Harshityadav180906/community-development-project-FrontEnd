import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  Camera,
  Truck,
  Building,
  Users,
  RotateCw,
  X,
  CreditCard,
  DollarSign,
  PlusCircle,
  ExternalLink,
  MapPin,
  Check,
  Calendar,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'tickets', 'riders'
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [orderStatus, setOrderStatus] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('All');

  // Photo Proof Modal
  const [selectedPhotoOrder, setSelectedPhotoOrder] = useState(null);

  // Ticket Modal States
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Delivery Issue');
  const [newTicketPriority, setNewTicketPriority] = useState('Medium');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');

  // Resolve Ticket Modal
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingStatus, setResolvingStatus] = useState('Resolved');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, ordersRes, ticketsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/orders', { params: { status: orderStatus, search: orderSearch } }),
        api.get('/admin/tickets', { params: { status: ticketStatus } }),
      ]);

      if (overviewRes.data?.data) setOverview(overviewRes.data.data);
      if (ordersRes.data?.data) setOrders(ordersRes.data.data);
      if (ticketsRes.data?.data) setTickets(ticketsRes.data.data);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [orderStatus, ticketStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/tickets', {
        title: newTicketTitle,
        description: newTicketDesc,
        category: newTicketCategory,
        priority: newTicketPriority,
        relatedOrderId: newTicketOrderId || null,
      });
      setShowCreateTicketModal(false);
      setNewTicketTitle('');
      setNewTicketDesc('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ticket.');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicketForResolve) return;
    try {
      await api.patch(`/admin/tickets/${selectedTicketForResolve._id}`, {
        status: resolvingStatus,
        resolutionNotes,
      });
      setSelectedTicketForResolve(null);
      setResolutionNotes('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket.');
    }
  };

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    backgroundColor: '#1E3A8A',
                    color: '#FFFFFF',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Super Admin HQ
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Platform Operations & Quality Audit
                </span>
              </div>
              <h1 style={{ margin: 0 }}>Operations Command Center</h1>
              <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Welcome, <strong>{user?.name}</strong> • Central Operations Team
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button onClick={fetchAdminData} className="btn btn-secondary btn-sm" title="Refresh Live Data">
                <RotateCw size={14} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="btn btn-accent btn-sm"
              >
                <PlusCircle size={14} />
                Raise Support Ticket
              </button>
            </div>
          </div>
        </div>

        {/* 4-KPI Overview Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Total Surplus Rescues
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
              {overview?.totalOrders ?? orders.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
              ✓ {overview?.completedOrders ?? 0} Completed Handouts
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Meals Saved from Waste
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {(overview?.totalServingsSaved ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Across {overview?.totalDonors ?? 3} Kitchens & {overview?.totalNgos ?? 2} NGOs
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Rider Payouts (₹15 / Order)
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>
              ₹{(overview?.totalRiderPayouts ?? 0).toLocaleString()}.00
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.25rem' }}>
              Guaranteed ₹15 rider incentive per rescue
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Open Tickets & Escalations
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: overview?.openTickets > 0 ? '#DC2626' : '#10B981' }}>
              {overview?.openTickets ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {overview?.resolvedTickets ?? 0} tickets resolved
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={17} />
            <span>All Orders & Proof Photos</span>
            <span className="tab-badge">{orders.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <FileText size={17} />
            <span>Support & Issue Tickets</span>
            <span className="tab-badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {tickets.filter((t) => t.status === 'Open').length} Open
            </span>
          </button>
        </div>

        {/* TAB 1: ALL ORDERS & PHOTO PROOF AUDIT */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Bar */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by order title, area, donor kitchen..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    <Search size={14} />
                    Search
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
                  {['All', 'Available', 'Claimed', 'Picked Up', 'Completed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatus(st)}
                      className={`filter-chip ${orderStatus === st ? 'active' : ''}`}
                      style={{ fontSize: '0.78rem', padding: '0.2rem 0.65rem' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Table / Cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading live platform orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order) => {
                  const hasPhoto = !!order.deliveryProofPhoto;
                  const isCompleted = order.status === 'Completed';

                  return (
                    <div
                      key={order._id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        borderLeft: isCompleted ? '4px solid #10B981' : '4px solid #F59E0B',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Top Row: Title, Status & Order ID */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                backgroundColor: 'var(--border-subtle)',
                                color: 'var(--primary-deep)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              ORD-#{order._id.slice(-6).toUpperCase()}
                            </span>
                            <StatusBadge status={order.status} />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: order.foodType === 'Veg' ? 'var(--food-veg-color)' : 'var(--food-nonveg-color)',
                              }}
                            >
                              • {order.foodType} ({order.quantityServings} Servings)
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-deep)', margin: 0 }}>
                            {order.title}
                          </h3>
                        </div>

                        {/* Photo Proof Action / Badge */}
                        <div>
                          {hasPhoto ? (
                            <button
                              onClick={() => setSelectedPhotoOrder(order)}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                backgroundColor: '#059669',
                                borderColor: '#059669',
                              }}
                            >
                              <Camera size={14} />
                              View Handover Photo
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                backgroundColor: '#F3F4F6',
                                padding: '0.3rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                display: 'inline-block',
                              }}
                            >
                              ⏳ Proof Photo Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stakeholder Details Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.75rem',
                          backgroundColor: 'var(--bg-cream)',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.825rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--primary-deep)' }}>🍽️ Donor Kitchen:</strong>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {order.donor?.organizationName || 'N/A'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {order.pickupAddress}
                          </div>
                        </div>

                        <div>
                          <strong style={{ color: '#1E40AF' }}>🏢 Recipient NGO:</strong>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {order.claimedBy?.organizationName || 'Unclaimed'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {order.claimedBy ? `${order.claimedBy.locality}, Bengaluru` : 'Awaiting NGO pickup'}
                          </div>
                        </div>

                        <div>
                          <strong style={{ color: '#D97706' }}>🚚 Assigned Rider:</strong>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {order.assignedDriver?.name || 'Unassigned'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {order.assignedDriver?.vehicleNumber
                              ? `${order.assignedDriver.vehicleType} (${order.assignedDriver.vehicleNumber})`
                              : 'No partner assigned'}
                          </div>
                        </div>
                      </div>

                      {/* Verification Audit Strip: OTP + Payment + Delivery Payout */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.65rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          {/* OTP Audit */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <strong>Handover OTP:</strong>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                backgroundColor: '#E0E7FF',
                                color: '#3730A3',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                              }}
                            >
                              {order.deliveryOtp || '----'}
                            </span>
                            {order.otpVerified ? (
                              <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                                ✓ Verified
                              </span>
                            ) : (
                              <span style={{ color: '#D97706', fontSize: '0.75rem' }}>⏳ Awaiting</span>
                            )}
                          </div>

                          {/* Payment Audit */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <strong>Payment:</strong>
                            <span
                              style={{
                                fontWeight: 700,
                                color: order.paymentStatus === 'Pending' ? '#9CA3AF' : '#059669',
                              }}
                            >
                              {order.paymentStatus === 'Paid_UPI'
                                ? '✓ ₹15.00 via UPI'
                                : order.paymentStatus === 'Paid_Cash'
                                ? '✓ ₹15.00 in Cash'
                                : 'Pending'}
                            </span>
                          </div>

                          {/* Rider Fee Credit */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309' }}>
                            <strong>Rider Fee:</strong>
                            <span>{isCompleted ? '₹15 Credited to Wallet' : '₹15 on Handover'}</span>
                          </div>
                        </div>

                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Updated: {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-feed">
                <Package size={36} style={{ color: 'var(--primary)' }} />
                <h3>No Orders Found</h3>
                <p>No food rescue orders match your current filter parameters.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPPORT & ISSUE TICKETS */}
        {activeTab === 'tickets' && (
          <div>
            {/* Ticket Header & Filter */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
                  {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTicketStatus(st)}
                      className={`filter-chip ${ticketStatus === st ? 'active' : ''}`}
                      style={{ fontSize: '0.78rem', padding: '0.2rem 0.65rem' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button onClick={() => setShowCreateTicketModal(true)} className="btn btn-accent btn-sm">
                  <PlusCircle size={14} />
                  New Support Ticket
                </button>
              </div>
            </div>

            {/* Ticket Cards */}
            {tickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tickets.map((ticket) => {
                  const isOpen = ticket.status === 'Open';
                  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';

                  return (
                    <div
                      key={ticket._id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        borderLeft: isOpen ? '4px solid #EF4444' : isResolved ? '4px solid #10B981' : '4px solid #F59E0B',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                backgroundColor: '#F3F4F6',
                                color: '#1F2937',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {ticket.ticketId}
                            </span>
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor:
                                  ticket.priority === 'Urgent'
                                    ? '#FEE2E2'
                                    : ticket.priority === 'High'
                                    ? '#FEF3C7'
                                    : '#E0F2FE',
                                color:
                                  ticket.priority === 'Urgent'
                                    ? '#B91C1C'
                                    : ticket.priority === 'High'
                                    ? '#B45309'
                                    : '#0369A1',
                              }}
                            >
                              {ticket.priority} Priority
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              • Category: <strong>{ticket.category}</strong>
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-deep)', margin: 0 }}>
                            {ticket.title}
                          </h3>
                        </div>

                        {/* Status & Resolve Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isOpen ? '#FEE2E2' : '#DCFCE7',
                              color: isOpen ? '#991B1B' : '#166534',
                            }}
                          >
                            {ticket.status}
                          </span>
                          {!isResolved && (
                            <button
                              onClick={() => {
                                setSelectedTicketForResolve(ticket);
                                setResolutionNotes(ticket.resolutionNotes || '');
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {ticket.description}
                      </p>

                      {ticket.resolutionNotes && (
                        <div
                          style={{
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: '#166534',
                          }}
                        >
                          <strong>✓ Resolution Notes:</strong> {ticket.resolutionNotes}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          Reported by: <strong>{ticket.createdBy?.name || 'Company Staff'}</strong> ({ticket.createdBy?.role || 'Staff'})
                        </div>
                        <div>
                          Created: {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-feed">
                <FileText size={36} style={{ color: 'var(--primary)' }} />
                <h3>No Support Tickets Found</h3>
                <p>All platform operations, driver deliveries, and handover tickets are currently resolved.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: HD FOOD DELIVERY PROOF PHOTO VIEWER */}
      <Modal
        isOpen={!!selectedPhotoOrder}
        onClose={() => setSelectedPhotoOrder(null)}
        title={`📸 Delivery Handover Proof: ${selectedPhotoOrder?.title}`}
        size="lg"
        footer={
          <button onClick={() => setSelectedPhotoOrder(null)} className="btn btn-primary">
            Close Viewer
          </button>
        }
      >
        {selectedPhotoOrder && (
          <div>
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                backgroundColor: '#111827',
                textAlign: 'center',
                maxHeight: '420px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <img
                src={selectedPhotoOrder.deliveryProofPhoto}
                alt="Delivery proof captured by rider"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-cream)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.65rem',
              }}
            >
              <div>
                <strong>Delivered To:</strong> {selectedPhotoOrder.claimedBy?.organizationName}
              </div>
              <div>
                <strong>Captured By Rider:</strong> {selectedPhotoOrder.assignedDriver?.name} ({selectedPhotoOrder.assignedDriver?.vehicleNumber})
              </div>
              <div>
                <strong>Handover OTP Verified:</strong> ✅ {selectedPhotoOrder.deliveryOtp}
              </div>
              <div>
                <strong>Delivery Compensation:</strong> ₹15.00 ({selectedPhotoOrder.paymentMethod || 'UPI'})
              </div>
              <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)' }}>
                <strong>Delivered At:</strong>{' '}
                {selectedPhotoOrder.deliveredAt
                  ? new Date(selectedPhotoOrder.deliveredAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Delivered'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: CREATE SUPPORT TICKET */}
      <Modal
        isOpen={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
        title="🎫 Raise Operational Support Ticket"
        footer={
          <>
            <button onClick={() => setShowCreateTicketModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateTicket} className="btn btn-primary">
              Submit Ticket
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Ticket Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Landmark clarification needed at dropoff location"
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newTicketCategory}
                onChange={(e) => setNewTicketCategory(e.target.value)}
              >
                <option value="Delivery Issue">Delivery Issue</option>
                <option value="OTP Verification">OTP Verification</option>
                <option value="Payment & Payout">Payment & Payout</option>
                <option value="Food Quality Concern">Food Quality Concern</option>
                <option value="Address & Navigation">Address & Navigation</option>
                <option value="Rider Assistance">Rider Assistance</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={newTicketPriority}
                onChange={(e) => setNewTicketPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Detailed Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe the operational issue or assistance required..."
              value={newTicketDesc}
              onChange={(e) => setNewTicketDesc(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: RESOLVE TICKET */}
      <Modal
        isOpen={!!selectedTicketForResolve}
        onClose={() => setSelectedTicketForResolve(null)}
        title={`Resolve Ticket #${selectedTicketForResolve?.ticketId}`}
        footer={
          <>
            <button onClick={() => setSelectedTicketForResolve(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleResolveTicket} className="btn btn-primary">
              <Check size={14} />
              Confirm Resolution
            </button>
          </>
        }
      >
        <div>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
            <strong>Issue:</strong> {selectedTicketForResolve?.title}
          </p>

          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select
              className="form-select"
              value={resolvingStatus}
              onChange={(e) => setResolvingStatus(e.target.value)}
            >
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Resolution Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Explain how this issue was resolved..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
