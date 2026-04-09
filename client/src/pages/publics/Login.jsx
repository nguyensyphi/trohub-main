/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon, LockIcon, Mail, PhoneCall, User2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGoogleLogin } from "@react-oauth/google"
import { useMeStore } from "@/zustand/useMeStore"
import { apiLoginWithEmail, apiLoginWithPhone, apiRegisterWithEmail, apiRegisterWithPhone } from "@/apis/auth"
import { toast } from "sonner"
import { apiGetGoogleCredentials } from "@/apis/external"
import SetupPassword from "./SetupPassword"
import pathnames from "@/lib/pathnames"

const formEmailSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
})
const formPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, { message: "Số điện thoại không hợp lệ." })
    .refine((val) => !isNaN(val), { message: "Số điện thoại không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
})

const googleOAuthConfigured = Boolean((import.meta.env.VITE_CLIENT_GG_ID || "").trim())

const Login = () => {
  const [isShowPassword, setIsShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [isSetUpPassword, setIsSetUpPassword] = useState(false)
  const [activedTab, setActivedTab] = useState("email")
  const [activedSchema, setActivedSchema] = useState(formEmailSchema)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setGoogleData, setToken } = useMeStore()

  useEffect(() => {
    let schema = activedTab === "email" ? formEmailSchema : formPhoneSchema
    if (isRegister)
      schema = schema.extend({ fullname: z.string().min(1, { message: "Tên không được bỏ trống." }) })
    setActivedSchema(schema)
  }, [activedTab, isRegister])

  const form = useForm({
    resolver: zodResolver(activedSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      fullname: "",
    },
  })

  useEffect(() => {
    form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegister, activedTab])

  const onSubmit = async (data) => {
    const { isRemember, ...payload } = data
    let response
    if (isRegister) {
      response =
        activedTab === "email" ? await apiRegisterWithEmail(payload) : await apiRegisterWithPhone(payload)
      if (response.data.success) {
        toast.success(response.data.msg)
        setIsRegister(false)
      } else toast.error(response.data.msg)
    } else {
      response = activedTab === "email" ? await apiLoginWithEmail(payload) : await apiLoginWithPhone(payload)
      if (response.data.success) {
        toast.success(response.data.msg)
        setToken(response.data.accessToken)
        handleRedirect()
      } else toast.error(response.data.msg)
    }
  }

  const handleRedirect = () => {
    const redirectPath = searchParams.get("redirect")
    if (redirectPath) navigate(redirectPath)
    else navigate("/")
  }

  const handleLoginGoogle = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (response) => {
      if (!response.access_token) return toast.error("Có lỗi, hãy thử lại nhé~")
      try {
        const credentialsRes = await apiGetGoogleCredentials(response.access_token)
        if (credentialsRes.status === 200 && credentialsRes.data?.email) {
          toast.success("Đăng nhập thành công.")
          const payload = {
            fullname: credentialsRes.data.name || credentialsRes.data.email,
            email: credentialsRes.data.email,
            avatar: credentialsRes.data.picture,
          }
          setGoogleData(payload)
          setIsSetUpPassword(true)
        } else {
          toast.error("Không lấy được thông tin tài khoản Google.")
        }
      } catch (err) {
        console.error("Google userinfo:", err)
        toast.error("Không lấy được thông tin tài khoản Google.")
      }
    },
    onError: (error) => {
      console.error("Google OAuth:", error)
      const t = error?.type || error?.error
      if (t === "popup_closed_by_user" || t === "user_cancelled") {
        toast.error("Bạn đã đóng cửa sổ đăng nhập Google.")
        return
      }
      toast.error(
        "Đăng nhập Google thất bại. Nếu bạn đổi domain: vào Google Cloud Console → Credentials → OAuth 2.0 Client (Web) → Authorized JavaScript origins — thêm đúng origin (vd: https://tenmien.com, không có dấu / cuối; thêm cả http://localhost:5173 khi dev)."
      )
    },
  })

  return (
    <div className="h-full min-h-[70vh] flex justify-center py-16 md:py-24 bg-muted/30">
      <div className="w-[700px] max-w-[calc(100%-2rem)] bg-card border border-border h-fit rounded-2xl shadow-soft grid grid-cols-10 overflow-hidden">
        <div className="col-span-4 flex items-center justify-center p-8">
          <img src="Login.svg" alt="banner" className="w-full object-contain" />
        </div>
        {!isSetUpPassword && (
          <div className="col-span-6 p-6">
            <p className="font-bold text-base">Xin chào bạn</p>
            <p className="font-bold text-2xl mt-1 mb-6">
              {isRegister ? "Đăng ký tài khoản mới" : "Đăng nhập để tiếp tục"}
            </p>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs value={activedTab} onValueChange={setActivedTab}>
                  <TabsList>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="phone">Số điện thoại</TabsTrigger>
                  </TabsList>
                  <TabsContent value="email">
                    <FormField
                      name="email"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormControl>
                            <Input className="pl-10" {...field} placeholder="Email của bạn" />
                          </FormControl>
                          <div className="absolute -top-1 w-10 h-10 flex items-center justify-center bg-transparent">
                            <Mail size={16} className="mb-[6px]" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="phone">
                    <FormField
                      name="phone"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormControl>
                            <Input className="pl-10" {...field} placeholder="Số điện thoại của bạn" />
                          </FormControl>
                          <div className="absolute -top-1 w-10 h-10 flex items-center justify-center bg-transparent">
                            <PhoneCall size={16} className="mb-[6px]" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <Input
                          className="pl-10"
                          {...field}
                          placeholder="Mật khẩu"
                          type={isShowPassword ? "text" : "password"}
                        />
                      </FormControl>
                      <div className="absolute -top-1 w-10 h-10 flex items-center justify-center bg-transparent">
                        <LockIcon size={16} className="mb-[6px]" />
                      </div>
                      <div
                        onClick={() => setIsShowPassword(!isShowPassword)}
                        className="absolute -top-1 cursor-pointer right-0 w-10 h-10 flex text-slate-400 items-center justify-center bg-transparent"
                      >
                        {isShowPassword ? (
                          <EyeIcon size={16} className="mb-[6px]" />
                        ) : (
                          <EyeOffIcon size={16} className="mb-[6px]" />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isRegister && (
                  <FormField
                    name="fullname"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="relative">
                        <FormControl>
                          <Input className="pl-10" {...field} placeholder="Tên đầy đủ" />
                        </FormControl>
                        <div className="absolute -top-1 w-10 h-10 flex items-center justify-center bg-transparent">
                          <User2Icon size={16} className="mb-[6px]" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button className="w-full" type="submit">
                  {isRegister ? "Đăng ký" : "Đăng nhập"}
                </Button>
                {!isRegister && (
                  <div className="text-sm flex items-center justify-between my-2">
                    <Link
                      to={"/" + pathnames.publics.resetPassword}
                      className="cursor-pointer text-primary hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                )}
              </form>
            </Form>
            <div className="w-full h-6 flex items-center relative my-4">
              <div className="border-border border-t w-full h-px" />
              <div className="absolute inset-0 bg-transparent w-fit mx-auto">
                <p className="text-muted-foreground bg-card px-2 text-sm">Hoặc</p>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                className="w-full"
                type="button"
                onClick={() => handleLoginGoogle()}
                variant="outline"
                disabled={!googleOAuthConfigured}
                title={
                  !googleOAuthConfigured
                    ? "Thiếu VITE_CLIENT_GG_ID — thêm vào biến môi trường khi build"
                    : undefined
                }
              >
                <img src="/Google.svg" alt="google logo" className="w-5 h-5 mr-3 object-cover" />
                <span>Đăng nhập với Google</span>
              </Button>
              {!googleOAuthConfigured && (
                <p className="text-xs text-muted-foreground text-center">
                  Google chưa bật: cần <code className="text-[0.7rem]">VITE_CLIENT_GG_ID</code> khi build, và
                  origin production trong Google Cloud Console.
                </p>
              )}
            </div>
            {!isRegister ? (
              <p className="text-sm mt-4 text-center">
                Bạn chưa là thành viên?{" "}
                <span onClick={() => setIsRegister(true)} className="text-primary underline cursor-pointer">
                  Đăng ký
                </span>{" "}
                tại đây
              </p>
            ) : (
              <p className="text-sm mt-4 text-center">
                Bạn đã có tài khoản?{" "}
                <span
                  onClick={() => setIsRegister(false)}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập
                </span>{" "}
                tại đây
              </p>
            )}
          </div>
        )}
        {isSetUpPassword && (
          <div className="col-span-6 p-8">
            <SetupPassword />
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
