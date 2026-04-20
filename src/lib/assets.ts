export type Asset = {
  name: string;
  url: string;
};

export type AssetCategory = {
  name: string;
  assets: Asset[];
};

export const assetCategories: AssetCategory[] = [];
