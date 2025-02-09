import { StrictMode } from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Index } from '../views/pages/index'
import { Share } from "../views/pages/share";
import { Summary } from '../views/pages/summary';
import { Settings } from '../views/pages/settings';
import { CPI } from '../views/pages/cpi';
import { BPI } from '../views/pages/bpi';
import { Detail } from '../views/pages/detail';
import { ReferenceTable } from '../views/pages/reference-table';

export const Router = () => {
    return(
        <StrictMode>
            <BrowserRouter>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="/detail" element={<Detail />} />
                <Route path="/share" element={<Share />} />
                <Route path="/cpi" element={<CPI />} />
                <Route path="/bpi" element={<BPI />} />
                <Route path="/reference-table" element={<ReferenceTable />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
            </BrowserRouter>
        </StrictMode>
    );
}
