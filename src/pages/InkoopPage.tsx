import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2, CheckCircle, Upload, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const purchaseSchema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().optional(),
  toolType: z.string().min(2, 'Beschrijf het type gereedschap'),
  brand: z.string().optional(),
  quantity: z.number().min(1).default(1),
  condition: z.enum(['nieuw', 'gebruikt', 'defect', 'onbekend']),
  description: z.string().optional(),
});

type PurchaseForm = z.infer<typeof purchaseSchema>;

export default function InkoopPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: 1,
      condition: 'gebruikt',
    },
  });

  const onSubmit = async (data: PurchaseForm) => {
    setLoading(true);

    try {
      const { error } = await supabase.from('purchase_requests').insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        tool_type: data.toolType,
        brand: data.brand || null,
        quantity: data.quantity,
        condition: data.condition,
        description: data.description || null,
      });

      if (error) throw error;

      setSubmitted(true);
      reset();
      toast.success('Uw aanvraag is verzonden!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="industrial-gradient text-secondary-foreground py-16">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Wij Kopen <span className="text-primary">Gereedschap</span>
            </h1>
            <p className="text-lg text-secondary-foreground/80">
              Heeft u gereedschap dat u niet meer gebruikt? Wij kopen nieuw en gebruikt gereedschap tegen eerlijke prijzen. Vul het formulier in en wij nemen contact met u op.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            {submitted ? (
              <div className="text-center py-12 px-6 bg-card rounded-lg border border-border">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Bedankt voor uw aanvraag!</h2>
                <p className="text-muted-foreground mb-6">
                  Wij nemen zo snel mogelijk contact met u op om uw gereedschap te bespreken.
                </p>
                <Button onClick={() => setSubmitted(false)}>
                  Nog een aanvraag versturen
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Verkoop Aanvraag</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Naam *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Uw naam"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">E-mailadres *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="uw@email.nl"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefoonnummer (optioneel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="+31 6 12345678"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toolType">Type Gereedschap *</Label>
                    <Input
                      id="toolType"
                      {...register('toolType')}
                      placeholder="bijv. Boormachine, Zaag"
                    />
                    {errors.toolType && (
                      <p className="text-sm text-destructive mt-1">{errors.toolType.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="brand">Merk (optioneel)</Label>
                    <Input
                      id="brand"
                      {...register('brand')}
                      placeholder="bijv. Makita, DeWalt"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Aantal</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      {...register('quantity', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Conditie *</Label>
                    <Select
                      value={watch('condition')}
                      onValueChange={(v) => setValue('condition', v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer conditie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nieuw">Nieuw (ongebruikt)</SelectItem>
                        <SelectItem value="gebruikt">Gebruikt (werkend)</SelectItem>
                        <SelectItem value="defect">Defect / Reparatie nodig</SelectItem>
                        <SelectItem value="onbekend">Onbekend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Extra informatie (optioneel)</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Beschrijf het gereedschap, eventuele schade, inclusief accessoires, etc."
                    rows={4}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Aanvraag Versturen
                </Button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Hoe werkt het?</h2>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Vul het formulier in',
                    description: 'Geef informatie over het gereedschap dat u wilt verkopen',
                  },
                  {
                    step: '2',
                    title: 'Wij nemen contact op',
                    description: 'Binnen 24 uur ontvangt u een reactie van ons team',
                  },
                  {
                    step: '3',
                    title: 'Ontvang een bod',
                    description: 'Wij doen u een eerlijk bod op basis van de conditie',
                  },
                  {
                    step: '4',
                    title: 'Snelle afhandeling',
                    description: 'Bij akkoord regelen wij ophalen of levering en betaling',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <Package className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Wat kopen wij in?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Handgereedschap (moersleutels, schroevendraaiers, etc.)</li>
                <li>✓ Elektrisch gereedschap (boormachines, slijpers, etc.)</li>
                <li>✓ Machines (compressoren, lasapparaten, etc.)</li>
                <li>✓ Meetinstrumenten en accessoires</li>
                <li>✓ Professioneel en consumentengereedschap</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
