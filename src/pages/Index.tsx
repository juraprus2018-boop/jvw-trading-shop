import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, TrendingUp, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';

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

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative industrial-gradient">
        <div className="container py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Kwaliteits<span className="text-primary">gereedschap</span> voor Professionals
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              Nieuw en gebruikt gereedschap van topmerken. Van handgereedschap tot professionele machines - wij hebben het allemaal.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/producten">
                <Button size="lg" className="gap-2">
                  Bekijk Producten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/inkoop">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Wij Kopen In
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Uitgelichte Producten</h2>
                <p className="text-muted-foreground mt-1">Onze beste aanbiedingen</p>
              </div>
              <Link to="/producten">
                <Button variant="ghost" className="gap-2">
                  Alle Producten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Nieuw Binnen</h2>
              <p className="text-muted-foreground mt-1">Ons nieuwste assortiment</p>
            </div>
            <Link to="/producten">
              <Button variant="ghost" className="gap-2">
                Bekijk Alles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-20 orange-gradient text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Gereedschap over? Wij kopen het!
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Heeft u gereedschap dat u niet meer gebruikt? Wij kopen nieuw en gebruikt gereedschap tegen eerlijke prijzen.
          </p>
          <Link to="/inkoop">
            <Button size="lg" variant="secondary" className="gap-2">
              Verkoop Uw Gereedschap
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
