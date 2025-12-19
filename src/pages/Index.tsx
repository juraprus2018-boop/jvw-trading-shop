import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, TrendingUp, Shield, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import logo from '@/assets/logo.png';

export default function Index() {
  const { data: featuredProducts, isLoading } = useProducts({ featured: true });
  const { data: latestProducts } = useProducts();

  const features = [
    {
      icon: Shield,
      title: 'Kwaliteitsgarantie',
      description: 'Al ons gereedschap wordt gecontroleerd op kwaliteit',
    },
    {
      icon: TrendingUp,
      title: 'Beste Prijzen',
      description: 'Scherpe prijzen voor nieuw én gebruikt gereedschap',
    },
    {
      icon: Truck,
      title: 'Snelle Levering',
      description: 'Bestel vandaag, morgen in huis',
    },
    {
      icon: Wrench,
      title: 'Groot Assortiment',
      description: 'Van handgereedschap tot professionele machines',
    },
  ];

  const stats = [
    { value: '500+', label: 'Producten' },
    { value: '1000+', label: 'Tevreden klanten' },
    { value: '10+', label: 'Jaar ervaring' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-28 lg:py-36 border-b">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Kwaliteits<span className="text-muted-foreground">gereedschap</span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                voor Professionals
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl">
                Nieuw en gebruikt gereedschap van topmerken. Van handgereedschap tot professionele machines.
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Gecontroleerde kwaliteit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Snelle verzending</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/producten?condition=nieuw">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Nieuwe Producten
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/producten?condition=gebruikt">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    Gebruikte Producten
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Secondary action */}
              <div className="pt-2">
                <Link to="/inkoop" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors">
                  Of verkoop uw gereedschap aan ons →
                </Link>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="hidden lg:block">
              <div className="border rounded-2xl p-8">
                <img src={logo} alt="JVW Trading" className="h-20 w-auto mx-auto mb-8" />
                <div className="grid grid-cols-3 gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Stats */}
          <div className="lg:hidden mt-12 grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center border rounded-xl p-4">
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Waarom JVW Trading?</h2>
            <p className="text-muted-foreground">Uw betrouwbare partner voor professioneel gereedschap</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group flex flex-col items-center text-center p-4 md:p-6 rounded-xl border hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl border mb-4">
                  <feature.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-2">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Uitgelichte Producten</h2>
                <p className="text-muted-foreground mt-1">Onze beste aanbiedingen</p>
              </div>
              <Link to="/producten">
                <Button variant="outline" className="gap-2">
                  Alle Producten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  condition={product.condition}
                  brand={product.brand || undefined}
                  image={product.images?.[0]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Nieuw Binnen</h2>
              <p className="text-muted-foreground mt-1">Ons nieuwste assortiment</p>
            </div>
            <Link to="/producten">
              <Button variant="outline" className="gap-2">
                Bekijk Alles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {latestProducts?.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : undefined}
                  condition={product.condition}
                  brand={product.brand || undefined}
                  image={product.images?.[0]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 border-t">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Gereedschap over? Wij kopen het!
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Heeft u gereedschap dat u niet meer gebruikt? Wij kopen nieuw en gebruikt gereedschap tegen eerlijke prijzen.
            </p>
            <Link to="/inkoop">
              <Button size="lg" className="gap-2">
                Verkoop Uw Gereedschap
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
