import { NextRequest, NextResponse } from 'next/server';
import { ApiKey } from '@/lib/models/ApiKey';
import { logError } from '@/lib/services/logger';

// DELETE /api/admin/keys/:id - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = await ApiKey.deleteById(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'API key deleted successfully'
    });
  } catch (error: any) {
    logError(error, { context: 'DELETE /api/admin/keys' });
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/keys/:id - Toggle API key active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }
    
    // Find the key
    const key = await ApiKey.findOne({ _id: id });
    
    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }
    
    // Toggle the active status
    key.isActive = !key.isActive;
    
    // Save the changes
    await key.save();
    
    return NextResponse.json({
      message: `API key ${key.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: key.isActive
    });
  } catch (error: any) {
    logError(error, { context: 'PATCH /api/admin/keys' });
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}