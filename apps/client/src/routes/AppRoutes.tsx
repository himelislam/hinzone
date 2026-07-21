import type { JSX } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '@/layouts/AdminLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import PublicLayout from '@/layouts/PublicLayout';
import AdminDepositDetailPage from '@/pages/admin/deposit/AdminDepositDetailPage';
import AdminDepositsPage from '@/pages/admin/deposit/AdminDepositsPage';
import AdminSettingsPage from '@/pages/admin/settings/AdminSettingsPage';
import CurrencySettingsPage from '@/pages/admin/settings/CurrencySettingsPage';
import DepositSettingsPage from '@/pages/admin/settings/DepositSettingsPage';
import GeneralSettingsPage from '@/pages/admin/settings/GeneralSettingsPage';
import HomepageSettingsPage from '@/pages/admin/settings/HomepageSettingsPage';
import MlmSettingsPage from '@/pages/admin/settings/MlmSettingsPage';
import NotificationSettingsPage from '@/pages/admin/settings/NotificationSettingsPage';
import SecuritySettingsPage from '@/pages/admin/settings/SecuritySettingsPage';
import StockSettingsPage from '@/pages/admin/settings/StockSettingsPage';
import TradingSettingsPage from '@/pages/admin/settings/TradingSettingsPage';
import WithdrawalSettingsPage from '@/pages/admin/settings/WithdrawalSettingsPage';
import AdminStockDetailPage from '@/pages/admin/stock/AdminStockDetailPage';
import AdminStockFormPage from '@/pages/admin/stock/AdminStockFormPage';
import AdminStocksPage from '@/pages/admin/stock/AdminStocksPage';
import AdminWithdrawalDetailPage from '@/pages/admin/withdrawal/AdminWithdrawalDetailPage';
import AdminWithdrawalsPage from '@/pages/admin/withdrawal/AdminWithdrawalsPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import DepositDashboardPage from '@/pages/deposit/DepositDashboardPage';
import DepositDetailsPage from '@/pages/deposit/DepositDetailsPage';
import DepositHistoryPage from '@/pages/deposit/DepositHistoryPage';
import TransactionHistoryPage from '@/pages/history/TransactionHistoryPage';
import EditProfilePage from '@/pages/profile/EditProfilePage';
import ProfilePage from '@/pages/profile/ProfilePage';
import FeaturedStocksPage from '@/pages/stock/FeaturedStocksPage';
import StockDetailsPage from '@/pages/stock/StockDetailsPage';
import StockListingPage from '@/pages/stock/StockListingPage';
import WalletDashboardPage from '@/pages/wallet/WalletDashboardPage';
import WithdrawalDashboardPage from '@/pages/withdrawal/WithdrawalDashboardPage';
import WithdrawalDetailsPage from '@/pages/withdrawal/WithdrawalDetailsPage';
import WithdrawalHistoryPage from '@/pages/withdrawal/WithdrawalHistoryPage';

import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

interface RoutePlaceholderProps {
  readonly title: string;
}

const RoutePlaceholder = ({ title }: RoutePlaceholderProps): JSX.Element => <div>{title}</div>;

const AppRoutes = (): JSX.Element => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<RoutePlaceholder title="Home" />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Public stock catalog - phase-07.md's Security section: "Public users
          may only view active stocks," matching stock.routes.ts carrying no
          `authenticate` middleware server-side. Still rendered inside
          DashboardLayout's chrome/nav (DashboardShell has no auth dependency
          of its own) so a logged-in user browsing here sees the same shell
          as every other authenticated page, but this block sits outside
          ProtectedRoute so an anonymous visitor can reach it too. */}
      <Route element={<DashboardLayout />}>
        <Route path="/stocks" element={<StockListingPage />} />
        <Route path="/stocks/featured" element={<FeaturedStocksPage />} />
        <Route path="/stocks/:id" element={<StockDetailsPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wallet" element={<WalletDashboardPage />} />
          <Route path="/deposits" element={<DepositHistoryPage />} />
          <Route path="/deposits/new" element={<DepositDashboardPage />} />
          <Route path="/deposits/:id" element={<DepositDetailsPage />} />
          <Route path="/withdrawals" element={<WithdrawalHistoryPage />} />
          <Route path="/withdrawals/new" element={<WithdrawalDashboardPage />} />
          <Route path="/withdrawals/:id" element={<WithdrawalDetailsPage />} />
          <Route path="/portfolio" element={<RoutePlaceholder title="Portfolio" />} />
          <Route path="/history" element={<TransactionHistoryPage />} />
          <Route path="/refer" element={<RoutePlaceholder title="Refer" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/settings" element={<RoutePlaceholder title="Settings" />} />
          <Route path="/notifications" element={<RoutePlaceholder title="Notifications" />} />
          <Route path="/trade" element={<RoutePlaceholder title="Trade" />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<RoutePlaceholder title="Admin Dashboard" />} />
            <Route path="/admin/deposits" element={<AdminDepositsPage />} />
            <Route path="/admin/deposits/:id" element={<AdminDepositDetailPage />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/admin/withdrawals/:id" element={<AdminWithdrawalDetailPage />} />
            <Route path="/admin/stocks" element={<AdminStocksPage />} />
            <Route path="/admin/stocks/new" element={<AdminStockFormPage />} />
            <Route path="/admin/stocks/:id/edit" element={<AdminStockFormPage />} />
            <Route path="/admin/stocks/:id" element={<AdminStockDetailPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/settings/general" element={<GeneralSettingsPage />} />
            <Route path="/admin/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/admin/settings/deposit" element={<DepositSettingsPage />} />
            <Route path="/admin/settings/withdrawal" element={<WithdrawalSettingsPage />} />
            <Route path="/admin/settings/trading" element={<TradingSettingsPage />} />
            <Route path="/admin/settings/stocks" element={<StockSettingsPage />} />
            <Route path="/admin/settings/mlm" element={<MlmSettingsPage />} />
            <Route path="/admin/settings/homepage" element={<HomepageSettingsPage />} />
            <Route path="/admin/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/admin/settings/security" element={<SecuritySettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
