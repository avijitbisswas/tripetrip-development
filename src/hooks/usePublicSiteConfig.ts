import { useEffect, useState } from 'react';
import { getPublicSiteConfig } from '@/src/services/admin';

type PublicContentConfig = {
  homepageAnnouncement?: string;
  featuredVendorSlugs?: string[];
  featuredListingIds?: string[];
  featuredDealSlugs?: string[];
};

type PublicSystemConfig = {
  registrationEnabled: boolean;
  communityEnabled: boolean;
  dealsEnabled: boolean;
  maintenanceMode: boolean;
};

const defaultSystemConfig: PublicSystemConfig = {
  registrationEnabled: true,
  communityEnabled: true,
  dealsEnabled: true,
  maintenanceMode: false,
};

export function usePublicSiteConfig() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<PublicContentConfig>({});
  const [system, setSystem] = useState<PublicSystemConfig>(defaultSystemConfig);

  useEffect(() => {
    let mounted = true;

    if (import.meta.env.MODE === 'test') {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    getPublicSiteConfig()
      .then((payload) => {
        if (!mounted) return;
        setContent(((payload.content as PublicContentConfig | undefined) || {}));
        setSystem({
          ...defaultSystemConfig,
          ...(((payload.system as Partial<PublicSystemConfig> | undefined) || {})),
        });
      })
      .catch(() => {
        if (!mounted) return;
        setContent({});
        setSystem(defaultSystemConfig);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, content, system };
}
