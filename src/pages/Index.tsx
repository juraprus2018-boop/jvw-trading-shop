import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, TrendingUp, Shield, Truck, Star, CheckCircle } from 'lucide-react';
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
      <section className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 industrial-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative py-16 md:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm text-white/90 font-medium">Specialist in tweedehands gereedschap</span>
              </div>
              
              {/* Title - responsive sizing */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Kwaliteits
                <span className="text-primary">gereedschap</span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                voor Professionals
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-xl">
                Nieuw en gebruikt gereedschap van topmerken. Van handgereedschap tot professionele machines.
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Gecontroleerde kwaliteit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Snelle verzending</span>
                </div>
              </div>
              
              {/* CTA Buttons - Direct links to new/used */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/producten?condition=nieuw">
                  <Button size="lg" className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                    Nieuwe Producten
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/producten?condition=gebruikt">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                    Gebruikte Producten
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Secondary action */}
              <div className="pt-2">
                <Link to="/inkoop" className="text-white/70 hover:text-white text-sm underline underline-offset-4 transition-colors">
                  Of verkoop uw gereedschap aan ons →
                </Link>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-3xl blur-2xl" />
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                  <img src={logo} alt="JVW Trading" className="h-20 w-auto mx-auto mb-8" />
                  <div className="grid grid-cols-3 gap-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Stats */}
          <div className="lg:hidden mt-12 grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Waarom JVW Trading?</h2>
            <p className="text-muted-foreground">Uw betrouwbare partner voor professioneel gereedschap</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group flex flex-col items-center text-center p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
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
      <section className="py-16 bg-muted/30">
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
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 milwaukee-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="container relative text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              Gereedschap over? Wij kopen het!
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8">
              Heeft u gereedschap dat u niet meer gebruikt? Wij kopen nieuw en gebruikt gereedschap tegen eerlijke prijzen.
            </p>
            <Link to="/inkoop">
              <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
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
