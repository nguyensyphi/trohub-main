import { lazy, Suspense } from "react"
import { Loader2 } from "lucide-react"

import App from "./App"
import pathnames from "./lib/pathnames"
import { GlobalErrorBoundary } from "./components/ErrorBoundary"

const withSuspense = (Component) => (
  <Suspense fallback={
    <div className="w-full flex min-h-screen bg-white bg-opacity-70 flex-col items-center justify-center p-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  }>
    <Component />
  </Suspense>
)

// ========= LAZY LOAD ROUTE COMPONENTS ========= //

/* ADMIN */
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"))
const AdminGeneral = lazy(() => import("./pages/admin/AdminGeneral"))
const CreateNews = lazy(() => import("./pages/admin/news/CreateNews"))
const ManageNews = lazy(() => import("./pages/admin/news/ManageNews"))
const ManagePostAdmin = lazy(() => import("./pages/admin/ManagePost"))
const ManageUser = lazy(() => import("./pages/admin/ManageUser"))

/* OWNERS */
const BalanceInfo = lazy(() => import("./pages/owners/BalanceInfo"))
const CreatePost = lazy(() => import("./pages/owners/CreatePost"))
const Deposit = lazy(() => import("./pages/owners/Deposit"))
const DepositVnpay = lazy(() => import("./pages/owners/DepositVnpay"))
const ExpiredHistory = lazy(() => import("./pages/owners/ExpiredHistory"))
const General = lazy(() => import("./pages/owners/General"))
const ManagePost = lazy(() => import("./pages/owners/ManagePost"))
const OwnerLayout = lazy(() => import("./pages/owners/OwnerLayout"))
const PaymentHistory = lazy(() => import("./pages/owners/PaymentHistory"))
const ManageOrder = lazy(() => import("./pages/owners/ManageOrder"))

/* USERS */
const ChangeEmail = lazy(() => import("./pages/users/ChangeEmail"))
const ChangePhone = lazy(() => import("./pages/users/ChangePhone"))
const Personal = lazy(() => import("./pages/users/Personal"))
const SeenPost = lazy(() => import("./pages/users/SeenPost"))
const UserLayout = lazy(() => import("./pages/users/UserLayout"))
const Wishlist = lazy(() => import("./pages/users/Wishlist"))

/* PUBLICS */
const ChoThueCanHo = lazy(() => import("./pages/publics/ChoThueCanHo"))
const ChoThuePhongTro = lazy(() => import("./pages/publics/ChoThuePhongTro"))
const DetailNews = lazy(() => import("./pages/publics/DetailNews"))
const DetailPost = lazy(() => import("./pages/publics/DetailPost"))
const Homepage = lazy(() => import("./pages/publics/Homepage"))
const Login = lazy(() => import("./pages/publics/Login"))
const News = lazy(() => import("./pages/publics/News"))
const NhaChoThue = lazy(() => import("./pages/publics/NhaChoThue"))
const PaymentNotice = lazy(() => import("./pages/publics/PaymentNotice"))
const PublicLayout = lazy(() => import("./pages/publics/PublicLayout"))
const ResetPassword = lazy(() => import("./pages/publics/ResetPassword"))
const SearchLayout = lazy(() => import("./pages/publics/SearchLayout"))
const SetupPassword = lazy(() => import("./pages/publics/SetupPassword"))

/* Others */
const PaymentOnBoarding = lazy(() => import("./pages/PaymentOnBoarding"))


const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      {
        path: pathnames.publics.layout,
        element: withSuspense(PublicLayout),
        children: [
          {
            path: pathnames.publics.homepage,
            element: withSuspense(Homepage),
          },
          {
            path: pathnames.publics.resetPassword,
            element: withSuspense(ResetPassword),
          },
          {
            path: pathnames.publics.updatePassword,
            element: withSuspense(SetupPassword),
          },
          {
            path: pathnames.publics.news,
            element: withSuspense(News),
          },
          {
            path: pathnames.publics.detailNews__id,
            element: withSuspense(DetailNews),
          },
          {
            path: pathnames.publics.search,
            element: withSuspense(SearchLayout),
          },
          {
            path: pathnames.publics.detailPost_idPost,
            element: withSuspense(DetailPost),
          },
          {
            path: pathnames.publics.login,
            element: withSuspense(Login),
          },
          {
            path: pathnames.publics.chothuecanho,
            element: withSuspense(ChoThueCanHo),
          },
          {
            path: pathnames.publics.chothuephongtro,
            element: withSuspense(ChoThuePhongTro),
          },
          {
            path: pathnames.publics.nhachothue,
            element: withSuspense(NhaChoThue),
          },
        ],
      },
      {
        path: pathnames.publics.payment__status,
        element: withSuspense(PaymentNotice),
      },
      {
        path: pathnames.user.layout,
        element: withSuspense(UserLayout),
        children: [
          {
            path: pathnames.user.personal,
            element: withSuspense(Personal),
          },
          {
            path: pathnames.user.changeEmail,
            element: withSuspense(ChangeEmail),
          },
          {
            path: pathnames.user.changePhone,
            element: withSuspense(ChangePhone),
          },
          {
            path: pathnames.user.seenPost,
            element: withSuspense(SeenPost),
          },
          {
            path: pathnames.user.wishlist,
            element: withSuspense(Wishlist),
          },
          {
            path: pathnames.user.paymentHistory,
            element: withSuspense(PaymentHistory),
          },
          {
            path: pathnames.user.expiredHistory,
            element: withSuspense(ExpiredHistory),
          },
          {
            path: pathnames.user.depositVnpay,
            element: withSuspense(DepositVnpay),
          },
          {
            path: pathnames.user.balanceInfo,
            element: withSuspense(BalanceInfo),
          },
        ],
      },
      {
        path: pathnames.owner.layout,
        element: withSuspense(OwnerLayout),
        children: [
          {
            path: pathnames.owner.general,
            element: withSuspense(General),
          },
          {
            path: pathnames.owner.createPost,
            element: withSuspense(CreatePost),
          },
          {
            path: pathnames.owner.managePost,
            element: withSuspense(ManagePost),
          },
          {
            path: pathnames.owner.manageOrder,
            element: withSuspense(ManageOrder),
          },
        ],
      },
      {
        path: pathnames.paymentOnBoarding,
        element: withSuspense(PaymentOnBoarding),
      },
      {
        path: pathnames.admin.layout,
        element: withSuspense(AdminLayout),
        children: [
          {
            path: pathnames.admin.general,
            element: withSuspense(AdminGeneral),
          },
          {
            path: pathnames.admin.manageUser,
            element: withSuspense(ManageUser),
          },
          {
            path: pathnames.admin.createNews,
            element: withSuspense(CreateNews),
          },
          {
            path: pathnames.admin.manageNews,
            element: withSuspense(ManageNews),
          },
          {
            path: pathnames.owner.managePost,
            element: withSuspense(ManagePostAdmin),
          },
        ],
      },
    ],
  },
]

export default routes
