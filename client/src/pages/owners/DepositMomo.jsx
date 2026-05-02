import { Form } from "@/components/ui/form"
import { CustomInput } from "@/components/forms"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Section from "@/components/Section"
import { apiDepositMomo } from "@/apis/user"

const formSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Số tiền không hợp lệ." })
    .refine((val) => val >= 10000 && !isNaN(val), { message: "Số tiền tối thiểu 10.000" }),
})

const DepositMomo = () => {
  const form = useForm({
    defaultValues: {
      amount: 0,
    },
    resolver: zodResolver(formSchema),
  })

  const onMomo = async (data) => {
    const response = await apiDepositMomo(data)
    if (response.data.success && response.data.paymentUrl) {
      window.open(response.data.paymentUrl, "_self")
    } else toast.error(response.data?.msg || "Không tạo được giao dịch MoMo.")
  }

  return (
    <div className="w-[700px] max-w-full m-auto py-4 space-y-4">
      <Section title="Nạp tiền qua Ví MoMo">
        <div className="space-y-4">
          <Form {...form}>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <CustomInput type="number" form={form} id="amount" label="Số tiền (vnđ)" />
              <div className="flex flex-wrap gap-3">
                <Button size="sm" type="button" onClick={form.handleSubmit(onMomo)}>
                  Thanh toán MoMo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                MoMo: cấu hình biến môi trường trên server; IPN cần URL công khai (ngrok khi dev local).
              </p>
            </form>
          </Form>
        </div>
      </Section>
    </div>
  )
}

export default DepositMomo
